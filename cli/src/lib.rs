mod component;
mod instructions;
mod rust_template;
mod system;
mod templates;
mod workspace;

use crate::component::new_component;
use crate::instructions::{approve_system, authorize, deauthorize, remove_system};
use crate::rust_template::{create_component, create_system};
use crate::system::new_system;
use anchor_cli::config;
use anchor_cli::config::{
    BootstrapMode, Config, ConfigOverride, GenesisEntry, ProgramArch, ProgramDeployment,
    TestValidator, Validator, WithPath,
};
use anchor_client::Cluster;
use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use component::{append_component_to_lib_rs, extract_component_id, generate_component_type_file};
use heck::{ToKebabCase, ToSnakeCase};
use std::collections::BTreeMap;
use std::fs::{self, create_dir_all, File};
use std::io::Write;
use std::io::{self, BufRead};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::string::ToString;
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const ANCHOR_VERSION: &str = anchor_cli::VERSION;
#[derive(Subcommand)]
pub enum BoltCommand {
    #[clap(about = "Create a new component")]
    Component(ComponentCommand),
    #[clap(about = "Create a new system")]
    System(SystemCommand),
    // Include all existing commands from anchor_cli::Command
    #[clap(flatten)]
    Anchor(anchor_cli::Command),
    #[clap(about = "Add a new authority for a world instance")]
    Authorize(AuthorizeCommand),
    #[clap(about = "Remove an authority from a world instance")]
    Deauthorize(DeauthorizeCommand),
    #[clap(about = "Approve a system for a world instance")]
    ApproveSystem(ApproveSystemCommand),
    #[clap(about = "Remove a system from a world instance")]
    RemoveSystem(RemoveSystemCommand),
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
pub struct AuthorizeCommand {
    pub world: String,
    pub new_authority: String,
}

#[derive(Debug, Parser)]
pub struct DeauthorizeCommand {
    pub world: String,
    pub authority_to_remove: String,
}

#[derive(Debug, Parser)]
pub struct ApproveSystemCommand {
    pub world: String,
    pub system_to_approve: String,
}

#[derive(Debug, Parser)]
pub struct RemoveSystemCommand {
    pub world: String,
    pub system_to_remove: String,
}

#[derive(Parser)]
#[clap(version = VERSION)]
pub struct Opts {
    /// Rebuild the auto-generated types
    #[clap(global = true, long, action)]
    pub rebuild_types: bool,
    #[clap(flatten)]
    pub cfg_override: ConfigOverride,
    #[clap(subcommand)]
    pub command: BoltCommand,
}

pub fn entry(opts: Opts) -> Result<()> {
    match opts.command {
        BoltCommand::Anchor(command) => match command {
            anchor_cli::Command::Init {
                name,
                javascript,
                solidity,
                no_install,
                no_git,
                template,
                test_template,
                force,
            } => init(
                &opts.cfg_override,
                name,
                javascript,
                solidity,
                no_install,
                no_git,
                template,
                test_template,
                force,
            ),
            anchor_cli::Command::Build {
                idl,
                no_idl,
                idl_ts,
                verifiable,
                program_name,
                solana_version,
                docker_image,
                bootstrap,
                cargo_args,
                env,
                skip_lint,
                no_docs,
                arch,
            } => build(
                &opts.cfg_override,
                no_idl,
                idl,
                idl_ts,
                verifiable,
                skip_lint,
                program_name,
                solana_version,
                docker_image,
                bootstrap,
                None,
                None,
                env,
                cargo_args,
                no_docs,
                arch,
                opts.rebuild_types,
            ),
            _ => {
                let opts = anchor_cli::Opts {
                    cfg_override: opts.cfg_override,
                    command,
                };
                anchor_cli::entry(opts)
            }
        },
        BoltCommand::Component(command) => new_component(&opts.cfg_override, command.name),
        BoltCommand::System(command) => new_system(&opts.cfg_override, command.name),
        BoltCommand::Authorize(command) => {
            authorize(&opts.cfg_override, command.world, command.new_authority)
        }
        BoltCommand::Deauthorize(command) => deauthorize(
            &opts.cfg_override,
            command.world,
            command.authority_to_remove,
        ),
        BoltCommand::ApproveSystem(command) => {
            approve_system(&opts.cfg_override, command.world, command.system_to_approve)
        }
        BoltCommand::RemoveSystem(command) => {
            remove_system(&opts.cfg_override, command.world, command.system_to_remove)
        }
    }
}
// Bolt Init
#[allow(clippy::too_many_arguments)]
fn init(
    cfg_override: &ConfigOverride,
    name: String,
    javascript: bool,
    solidity: bool,
    no_install: bool,
    no_git: bool,
    template: anchor_cli::rust_template::ProgramTemplate,
    test_template: anchor_cli::rust_template::TestTemplate,
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
    let jest = test_template == anchor_cli::rust_template::TestTemplate::Jest;
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
        account: Some(vec![
            // Registry account
            anchor_cli::config::AccountEntry {
                address: "EHLkWwAT9oebVv9ht3mtqrvHhRVMKrt54tF3MfHTey2K".to_owned(),
                filename: "tests/fixtures/registry.json".to_owned(),
            },
        ]),
        ..Default::default()
    };

    let test_validator = TestValidator {
        startup_wait: 5000,
        shutdown_wait: 2000,
        validator: Some(validator),
        genesis: Some(vec![GenesisEntry {
            address: world::id().to_string(),
            program: "tests/fixtures/world.so".to_owned(),
            upgradeable: Some(false),
        }]),
        ..Default::default()
    };

    cfg.test_validator = Some(test_validator);
    cfg.programs.insert(Cluster::Localnet, localnet);
    let toml = cfg.to_string();
    fs::write("Anchor.toml", toml)?;

    // Initialize .gitignore file
    fs::write(".gitignore", templates::workspace::git_ignore())?;

    // Initialize .prettierignore file
    fs::write(".prettierignore", templates::workspace::prettier_ignore())?;

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
        create_system(system_name)?;
        create_component(component_name)?;
        rust_template::create_program(&project_name, template)?;

        // Add the component as a dependency to the system
        std::process::Command::new("cargo")
            .arg("add")
            .arg("--package")
            .arg(system_name)
            .arg("--path")
            .arg(format!("programs-ecs/components/{}", component_name))
            .arg("--features")
            .arg("cpi")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| {
                anyhow::format_err!(
                    "error adding component as dependency to the system: {}",
                    e.to_string()
                )
            })?;
    }

    // Build the test suite.
    fs::create_dir_all("tests/fixtures")?;
    // Build the migrations directory.
    fs::create_dir_all("migrations")?;

    // Create the registry account
    fs::write(
        "tests/fixtures/registry.json",
        rust_template::registry_account(),
    )?;

    // Dump the World program into tests/fixtures/world.so
    std::process::Command::new("solana")
        .arg("program")
        .arg("dump")
        .arg("-u")
        .arg("d")
        .arg(world::id().to_string())
        .arg("tests/fixtures/world.so")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| anyhow::format_err!("solana program dump failed: {}", e.to_string()))?;

    if javascript {
        // Build javascript config
        let mut package_json = File::create("package.json")?;
        package_json.write_all(templates::workspace::package_json(jest).as_bytes())?;

        if jest {
            let mut test = File::create(format!("tests/{}.test.js", &project_name))?;
            if solidity {
                test.write_all(anchor_cli::solidity_template::jest(&project_name).as_bytes())?;
            } else {
                test.write_all(templates::workspace::jest(&project_name).as_bytes())?;
            }
        } else {
            let mut test = File::create(format!("tests/{}.js", &project_name))?;
            if solidity {
                test.write_all(anchor_cli::solidity_template::mocha(&project_name).as_bytes())?;
            } else {
                test.write_all(templates::workspace::mocha(&project_name).as_bytes())?;
            }
        }

        let mut deploy = File::create("migrations/deploy.js")?;

        deploy.write_all(anchor_cli::rust_template::deploy_script().as_bytes())?;
    } else {
        // Build typescript config
        let mut ts_config = File::create("tsconfig.json")?;
        ts_config.write_all(anchor_cli::rust_template::ts_config(jest).as_bytes())?;

        let mut ts_package_json = File::create("package.json")?;
        ts_package_json.write_all(templates::workspace::ts_package_json(jest).as_bytes())?;

        let mut deploy = File::create("migrations/deploy.ts")?;
        deploy.write_all(anchor_cli::rust_template::ts_deploy_script().as_bytes())?;

        let mut mocha = File::create(format!("tests/{}.ts", &project_name))?;
        if solidity {
            mocha.write_all(anchor_cli::solidity_template::ts_mocha(&project_name).as_bytes())?;
        } else {
            mocha.write_all(templates::workspace::ts_mocha(&project_name).as_bytes())?;
        }
    }

    if !no_install {
        let yarn_result = install_node_modules("yarn")?;
        if !yarn_result.status.success() {
            println!("Failed yarn install will attempt to npm install");
            install_node_modules("npm")?;
        }
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

#[allow(clippy::too_many_arguments)]
pub fn build(
    cfg_override: &ConfigOverride,
    no_idl: bool,
    idl: Option<String>,
    idl_ts: Option<String>,
    verifiable: bool,
    skip_lint: bool,
    program_name: Option<String>,
    solana_version: Option<String>,
    docker_image: Option<String>,
    bootstrap: BootstrapMode,
    stdout: Option<File>,
    stderr: Option<File>,
    env_vars: Vec<String>,
    cargo_args: Vec<String>,
    no_docs: bool,
    arch: ProgramArch,
    rebuild_types: bool,
) -> Result<()> {
    let cfg = Config::discover(cfg_override)?.expect("Not in workspace.");
    let types_path = "crates/types/src";

    // If rebuild_types is true and the types directory exists, remove it
    if rebuild_types && Path::new(types_path).exists() {
        fs::remove_dir_all(
            PathBuf::from(types_path)
                .parent()
                .ok_or_else(|| anyhow::format_err!("Failed to remove types directory"))?,
        )?;
    }
    create_dir_all(types_path)?;
    build_dynamic_types(cfg, cfg_override, types_path)?;

    // Build the programs
    anchor_cli::build(
        cfg_override,
        no_idl,
        idl,
        idl_ts,
        verifiable,
        skip_lint,
        program_name,
        solana_version,
        docker_image,
        bootstrap,
        stdout,
        stderr,
        env_vars,
        cargo_args,
        no_docs,
        arch,
    )
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

fn discover_cluster_url(cfg_override: &ConfigOverride) -> Result<String> {
    let url = match Config::discover(cfg_override)? {
        Some(cfg) => cluster_url(&cfg, &cfg.test_validator),
        None => {
            if let Some(cluster) = cfg_override.cluster.clone() {
                cluster.url().to_string()
            } else {
                config::get_solana_cfg_url()?
            }
        }
    };
    Ok(url)
}

fn cluster_url(cfg: &Config, test_validator: &Option<TestValidator>) -> String {
    let is_localnet = cfg.provider.cluster == Cluster::Localnet;
    match is_localnet {
        // Cluster is Localnet, assume the intent is to use the configuration
        // for solana-test-validator
        true => test_validator_rpc_url(test_validator),
        false => cfg.provider.cluster.url().to_string(),
    }
}

// Return the URL that solana-test-validator should be running on given the
// configuration
fn test_validator_rpc_url(test_validator: &Option<TestValidator>) -> String {
    match test_validator {
        Some(TestValidator {
            validator: Some(validator),
            ..
        }) => format!("http://{}:{}", validator.bind_address, validator.rpc_port),
        _ => "http://127.0.0.1:8899".to_string(),
    }
}

fn build_dynamic_types(
    cfg: WithPath<Config>,
    cfg_override: &ConfigOverride,
    types_path: &str,
) -> Result<()> {
    let cur_dir = std::env::current_dir()?;
    for p in cfg.get_rust_program_list()? {
        process_program_path(&p, cfg_override, types_path)?;
    }
    let types_path = PathBuf::from(types_path);
    let cargo_path = types_path
        .parent()
        .unwrap_or(&types_path)
        .join("Cargo.toml");
    if !cargo_path.exists() {
        let mut file = File::create(cargo_path)?;
        file.write_all(templates::workspace::types_cargo_toml().as_bytes())?;
    }
    std::env::set_current_dir(cur_dir)?;
    Ok(())
}

fn process_program_path(
    program_path: &Path,
    cfg_override: &ConfigOverride,
    types_path: &str,
) -> Result<()> {
    let lib_rs_path = Path::new(types_path).join("lib.rs");
    let file = File::open(program_path.join("src").join("lib.rs"))?;
    let lines = io::BufReader::new(file).lines();
    let mut contains_dynamic_components = false;
    for line in lines.map_while(Result::ok) {
        if let Some(component_id) = extract_component_id(&line) {
            let file_path = PathBuf::from(format!("{}/component_{}.rs", types_path, component_id));
            if !file_path.exists() {
                println!("Generating type for Component: {}", component_id);
                generate_component_type_file(&file_path, cfg_override, component_id)?;
                append_component_to_lib_rs(&lib_rs_path, component_id)?;
            }
            contains_dynamic_components = true;
        }
    }
    if contains_dynamic_components {
        let program_name = program_path.file_name().unwrap().to_str().unwrap();
        add_types_crate_dependency(program_name, &types_path.replace("/src", ""))?;
    }

    Ok(())
}

fn add_types_crate_dependency(program_name: &str, types_path: &str) -> Result<()> {
    std::process::Command::new("cargo")
        .arg("add")
        .arg("--package")
        .arg(program_name)
        .arg("--path")
        .arg(types_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| {
            anyhow::format_err!(
                "error adding types as dependency to the program: {}",
                e.to_string()
            )
        })?;
    Ok(())
}
