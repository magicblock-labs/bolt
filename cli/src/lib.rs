mod rust_template;

use anchor_cli::config::{Config, ConfigOverride, WithPath};
use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use std::fs;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Subcommand)]
pub enum BoltCommand {
    // Include all existing commands from anchor_cli::Command
    #[clap(flatten)]
    Anchor(anchor_cli::Command),
    #[clap(about = "Create a new component")]
    Component(ComponentCommand),
    #[clap(about = "Create a new system")]
    System(SystemCommand),
}

#[derive(Debug, Parser)]
pub struct ComponentCommand {
    #[clap(short, long, help = "Name of the component")]
    pub name: String,
}

#[derive(Debug, Parser)]
pub struct SystemCommand {
    #[clap(short, long, help = "Name of the system")]
    pub name: String,
}

#[derive(Debug, Parser)]
pub struct Opts {
    #[clap(flatten)]
    pub cfg_override: ConfigOverride,
    #[clap(subcommand)]
    pub command: BoltCommand,
}

pub fn entry(opts: Opts) -> Result<()> {
    match opts.command {
        BoltCommand::Anchor(command) => {
            // Delegate to the existing anchor_cli handler
            let ops = anchor_cli::Opts {
                cfg_override: opts.cfg_override,
                command,
            };
            anchor_cli::entry(ops)
        }
        BoltCommand::Component(command) => new_component(&opts.cfg_override, command.name),
        BoltCommand::System(command) => new_system(&opts.cfg_override, command.name),
    }
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
