mod rust_template;

use crate::rust_template::{create_component, create_system};
use anchor_cli::config::{
    Config, ConfigOverride, ProgramDeployment, TestValidator, Validator, WithPath,
};
use anchor_client::Cluster;
use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use heck::{ToKebabCase, ToSnakeCase};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::Write;
use std::process::Stdio;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const ANCHOR_VERSION: &str = anchor_cli::VERSION;

#[derive(Debug, Subcommand)]
pub enum BoltCommand {
    #[clap(about = "Create a new component")]
    Component(ComponentCommand),
    #[clap(about = "Create a new system")]
    System(SystemCommand),
    // Include all existing commands from anchor_cli::Command
    #[clap(flatten)]
    Anchor(anchor_cli::Command),
}

#[derive(Debug, Parser)]
pub struct InitCommand {
    #[clap(short, long, help = "Workspace name")]
    pub workspace_name: String,
}

#[derive(Debug, Parser)]
pub struct ComponentCommand {
    pub name: String,
}

#[derive(Debug, Parser)]
pub struct SystemCommand {
    pub name: String,
}

#[derive(Debug, Parser)]
#[clap(version = VERSION)]
pub struct Opts {
    #[clap(flatten)]
    pub cfg_override: ConfigOverride,
    #[clap(subcommand)]
    pub command: BoltCommand,
}

pub fn entry(opts: Opts) -> Result<()> {
    match opts.command {
        BoltCommand::Anchor(command) => {
            if let anchor_cli::Command::Init {
                name,
                javascript,
                solidity,
                no_git,
                jest,
                template,
                force,
            } = command
            {
                init(
                    &opts.cfg_override,
                    name,
                    javascript,
                    solidity,
                    no_git,
                    jest,
                    template,
                    force,
                )
            } else {
                // Delegate to the existing anchor_cli handler
                let opts = anchor_cli::Opts {
                    cfg_override: opts.cfg_override,
                    command,
                };
                anchor_cli::entry(opts)
            }
        }
        BoltCommand::Component(command) => new_component(&opts.cfg_override, command.name),
        BoltCommand::System(command) => new_system(&opts.cfg_override, command.name),
    }
}

// Bolt Init

#[allow(clippy::too_many_arguments)]
fn init(
    cfg_override: &ConfigOverride,
    name: String,
    javascript: bool,
    solidity: bool,
    no_git: bool,
    jest: bool,
    template: anchor_cli::rust_template::ProgramTemplate,
    force: bool,
) -> Result<()> {
    if !force && Config::discover(cfg_override)?.is_some() {
        return Err(anyhow!("Workspace already initialized"));
    }

    // We need to format different cases for the dir and the name
    let rust_name = name.to_snake_case();
    let project_name = if name == rust_name {
        rust_name.clone()
    } else {
        name.to_kebab_case()
    };

    // Additional keywords that have not been added to the `syn` crate as reserved words
    // https://github.com/dtolnay/syn/pull/1098
    let extra_keywords = ["async", "await", "try"];
    let component_name = "position";
    let system_name = "movement";
    // Anchor converts to snake case before writing the program name
    if syn::parse_str::<syn::Ident>(&rust_name).is_err()
        || extra_keywords.contains(&rust_name.as_str())
    {
        return Err(anyhow!(
            "Anchor workspace name must be a valid Rust identifier. It may not be a Rust reserved word, start with a digit, or include certain disallowed characters. See https://doc.rust-lang.org/reference/identifiers.html for more detail.",
        ));
    }

    if force {
        fs::create_dir_all(&project_name)?;
    } else {
        fs::create_dir(&project_name)?;
    }
    std::env::set_current_dir(&project_name)?;
    fs::create_dir_all("app")?;

    let mut cfg = Config::default();
    if jest {
        cfg.scripts.insert(
            "test".to_owned(),
            if javascript {
                "yarn run jest"
            } else {
                "yarn run jest --preset ts-jest"
            }
            .to_owned(),
        );
    } else {
        cfg.scripts.insert(
            "test".to_owned(),
            if javascript {
                "yarn run mocha -t 1000000 tests/"
            } else {
                "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
            }
            .to_owned(),
        );
    }

    let mut localnet = BTreeMap::new();
    let program_id = anchor_cli::rust_template::get_or_create_program_id(&rust_name);
    localnet.insert(
        rust_name,
        ProgramDeployment {
            address: program_id,
            path: None,
            idl: None,
        },
    );
    if !solidity {
        let component_id = anchor_cli::rust_template::get_or_create_program_id(component_name);
        let system_id = anchor_cli::rust_template::get_or_create_program_id(system_name);
        localnet.insert(
            component_name.to_owned(),
            ProgramDeployment {
                address: component_id,
                path: None,
                idl: None,
            },
        );
        localnet.insert(
            system_name.to_owned(),
            ProgramDeployment {
                address: system_id,
                path: None,
                idl: None,
            },
        );
        cfg.workspace.members.push("programs/*".to_owned());
        cfg.workspace
            .members
            .push("programs-ecs/components/*".to_owned());
        cfg.workspace
            .members
            .push("programs-ecs/systems/*".to_owned());
    }

    // Setup the test validator to clone Bolt programs from devnet
    let validator = Validator {
        url: Some("https://rpc.magicblock.app/devnet/".to_owned()),
        rpc_port: 8899,
        bind_address: "0.0.0.0".to_owned(),
        ledger: ".bolt/test-ledger".to_owned(),
        clone: Some(vec![
            // World program
            anchor_cli::config::CloneEntry {
                address: "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n".to_owned(),
            },
            // World executable data
            anchor_cli::config::CloneEntry {
                address: "CrsqUXPpJYpVAAx5qMKU6K8RT1TzT81T8BL6JndWSeo3".to_owned(),
            },
            // Registry
            anchor_cli::config::CloneEntry {
                address: "EHLkWwAT9oebVv9ht3mtqrvHhRVMKrt54tF3MfHTey2K".to_owned(),
            },
        ]),
        ..Default::default()
    };

    let test_validator = TestValidator {
        startup_wait: 5000,
        shutdown_wait: 2000,
        validator: Some(validator),
        ..Default::default()
    };

    cfg.test_validator = Some(test_validator);
    cfg.programs.insert(Cluster::Localnet, localnet);
    let toml = cfg.to_string();
    fs::write("Anchor.toml", toml)?;

    // Initialize .gitignore file
    fs::write(".gitignore", rust_template::git_ignore())?;

    // Initialize .prettierignore file
    fs::write(".prettierignore", rust_template::prettier_ignore())?;

    // Remove the default programs if `--force` is passed
    if force {
        let programs_path = std::env::current_dir()?
            .join(if solidity { "solidity" } else { "programs" })
            .join(&project_name);
        fs::create_dir_all(&programs_path)?;
        fs::remove_dir_all(&programs_path)?;
        let programs_ecs_path = std::env::current_dir()?
            .join("programs-ecs")
            .join(&project_name);
        fs::create_dir_all(&programs_ecs_path)?;
        fs::remove_dir_all(&programs_ecs_path)?;
    }

    // Build the program.
    if solidity {
        anchor_cli::solidity_template::create_program(&project_name)?;
    } else {
        create_component(component_name)?;
        create_system(system_name)?;
        anchor_cli::rust_template::create_program(&project_name, template)?;
    }

    // Build the test suite.
    fs::create_dir_all("tests")?;
    // Build the migrations directory.
    fs::create_dir_all("migrations")?;

    if javascript {
        // Build javascript config
        let mut package_json = File::create("package.json")?;
        package_json.write_all(rust_template::package_json(jest).as_bytes())?;

        if jest {
            let mut test = File::create(format!("tests/{}.test.js", &project_name))?;
            if solidity {
                test.write_all(anchor_cli::solidity_template::jest(&project_name).as_bytes())?;
            } else {
                test.write_all(rust_template::jest(&project_name).as_bytes())?;
            }
        } else {
            let mut test = File::create(format!("tests/{}.js", &project_name))?;
            if solidity {
                test.write_all(anchor_cli::solidity_template::mocha(&project_name).as_bytes())?;
            } else {
                test.write_all(rust_template::mocha(&project_name).as_bytes())?;
            }
        }

        let mut deploy = File::create("migrations/deploy.js")?;

        deploy.write_all(anchor_cli::rust_template::deploy_script().as_bytes())?;
    } else {
        // Build typescript config
        let mut ts_config = File::create("tsconfig.json")?;
        ts_config.write_all(anchor_cli::rust_template::ts_config(jest).as_bytes())?;

        let mut ts_package_json = File::create("package.json")?;
        ts_package_json.write_all(rust_template::ts_package_json(jest).as_bytes())?;

        let mut deploy = File::create("migrations/deploy.ts")?;
        deploy.write_all(anchor_cli::rust_template::ts_deploy_script().as_bytes())?;

        let mut mocha = File::create(format!("tests/{}.ts", &project_name))?;
        if solidity {
            mocha.write_all(anchor_cli::solidity_template::ts_mocha(&project_name).as_bytes())?;
        } else {
            mocha.write_all(rust_template::ts_mocha(&project_name).as_bytes())?;
        }
    }

    let yarn_result = install_node_modules("yarn")?;
    if !yarn_result.status.success() {
        println!("Failed yarn install will attempt to npm install");
        install_node_modules("npm")?;
    }

    if !no_git {
        let git_result = std::process::Command::new("git")
            .arg("init")
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .output()
            .map_err(|e| anyhow::format_err!("git init failed: {}", e.to_string()))?;
        if !git_result.status.success() {
            eprintln!("Failed to automatically initialize a new git repository");
        }
    }

    println!("{project_name} initialized");

    Ok(())
}

// Install node modules
fn install_node_modules(cmd: &str) -> Result<std::process::Output> {
    let mut command = std::process::Command::new(if cfg!(target_os = "windows") {
        "cmd"
    } else {
        cmd
    });
    if cfg!(target_os = "windows") {
        command.arg(format!("/C {} install", cmd));
    } else {
        command.arg("install");
    }
    command
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output()
        .map_err(|e| anyhow::format_err!("{} install failed: {}", cmd, e.to_string()))
}

// Create a new component from the template
fn new_component(cfg_override: &ConfigOverride, name: String) -> Result<()> {
    with_workspace(cfg_override, |cfg| {
        match cfg.path().parent() {
            None => {
                println!("Unable to make new component");
            }
            Some(parent) => {
                std::env::set_current_dir(parent)?;

                let cluster = cfg.provider.cluster.clone();
                let programs = cfg.programs.entry(cluster).or_default();
                if programs.contains_key(&name) {
                    return Err(anyhow!("Program already exists"));
                }

                programs.insert(
                    name.clone(),
                    anchor_cli::config::ProgramDeployment {
                        address: {
                            rust_template::create_component(&name)?;
                            anchor_cli::rust_template::get_or_create_program_id(&name)
                        },
                        path: None,
                        idl: None,
                    },
                );

                let toml = cfg.to_string();
                fs::write("Anchor.toml", toml)?;

                println!("Created new component: {}", name);
            }
        };
        Ok(())
    })
}

// Create a new system from the template
fn new_system(cfg_override: &ConfigOverride, name: String) -> Result<()> {
    with_workspace(cfg_override, |cfg| {
        match cfg.path().parent() {
            None => {
                println!("Unable to make new system");
            }
            Some(parent) => {
                std::env::set_current_dir(parent)?;

                let cluster = cfg.provider.cluster.clone();
                let programs = cfg.programs.entry(cluster).or_default();
                if programs.contains_key(&name) {
                    return Err(anyhow!("Program already exists"));
                }

                programs.insert(
                    name.clone(),
                    anchor_cli::config::ProgramDeployment {
                        address: {
                            rust_template::create_system(&name)?;
                            anchor_cli::rust_template::get_or_create_program_id(&name)
                        },
                        path: None,
                        idl: None,
                    },
                );

                let toml = cfg.to_string();
                fs::write("Anchor.toml", toml)?;

                println!("Created new system: {}", name);
            }
        };
        Ok(())
    })
}

// with_workspace ensures the current working directory is always the top level
// workspace directory, i.e., where the `Anchor.toml` file is located, before
// and after the closure invocation.
//
// The closure passed into this function must never change the working directory
// to be outside the workspace. Doing so will have undefined behavior.
fn with_workspace<R>(
    cfg_override: &ConfigOverride,
    f: impl FnOnce(&mut WithPath<Config>) -> R,
) -> R {
    set_workspace_dir_or_exit();

    let mut cfg = Config::discover(cfg_override)
        .expect("Previously set the workspace dir")
        .expect("Anchor.toml must always exist");

    let r = f(&mut cfg);

    set_workspace_dir_or_exit();

    r
}

fn set_workspace_dir_or_exit() {
    let d = match Config::discover(&ConfigOverride::default()) {
        Err(err) => {
            println!("Workspace configuration error: {err}");
            std::process::exit(1);
        }
        Ok(d) => d,
    };
    match d {
        None => {
            println!("Not in anchor workspace.");
            std::process::exit(1);
        }
        Some(cfg) => {
            match cfg.path().parent() {
                None => {
                    println!("Unable to make new program");
                }
                Some(parent) => {
                    if std::env::set_current_dir(parent).is_err() {
                        println!("Not in anchor workspace.");
                        std::process::exit(1);
                    }
                }
            };
        }
    }
}
