use crate::{rust_template::create_bundle, workspace::with_workspace};
use anchor_cli::config::{ConfigOverride, ProgramDeployment};
use anyhow::{anyhow, Result};
use std::fs;

// Create a new component from the template
pub fn new_bundle(cfg_override: &ConfigOverride, name: String) -> Result<()> {
    with_workspace(cfg_override, |cfg| {
        match cfg.path().parent() {
            None => {
                println!("Unable to make new bundle");
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
                    ProgramDeployment {
                        address: {
                            create_bundle(&name)?;
                            anchor_cli::rust_template::get_or_create_program_id(&name)
                        },
                        path: None,
                        idl: None,
                    },
                );

                let toml = cfg.to_string();
                fs::write("Anchor.toml", toml)?;

                println!("Created new bundle: {}", name);
            }
        };
        Ok(())
    })
}
