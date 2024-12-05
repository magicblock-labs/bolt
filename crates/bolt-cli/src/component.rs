use crate::{
    discover_cluster_url,
    rust_template::create_component,
    templates::component::{component_type, component_type_import},
    workspace::with_workspace,
};
use anchor_cli::config::{ConfigOverride, ProgramDeployment};
use anchor_lang_idl::types::Idl;
use anyhow::{anyhow, Result};
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::Path,
    process::Stdio,
};

// Create a new component from the template
pub fn new_component(cfg_override: &ConfigOverride, name: String) -> Result<()> {
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
                    ProgramDeployment {
                        address: {
                            create_component(&name)?;
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

pub fn extract_component_id(line: &str) -> Option<&str> {
    let component_id_marker = "#[component_id(";
    line.find(component_id_marker).map(|start| {
        let start = start + component_id_marker.len();
        let end = line[start..].find(')').unwrap() + start;
        line[start..end].trim_matches('"')
    })
}

pub fn fetch_idl_for_component(component_id: &str, url: &str) -> Result<String> {
    let output = std::process::Command::new("bolt")
        .arg("idl")
        .arg("fetch")
        .arg(component_id)
        .arg("--provider.cluster")
        .arg(url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()?;

    if output.status.success() {
        let idl_string = String::from_utf8(output.stdout)
            .map_err(|e| anyhow!("Failed to decode IDL output as UTF-8: {}", e))?
            .to_string();
        Ok(idl_string)
    } else {
        let error_message = String::from_utf8(output.stderr)
            .unwrap_or(format!(
                "Error trying to dynamically generate the type \
            for component {}, unable to fetch the idl. \nEnsure that the idl is available. Specify \
            the appropriate cluster using the --provider.cluster option",
                component_id
            ))
            .to_string();
        Err(anyhow!("Command failed with error: {}", error_message))
    }
}

pub fn generate_component_type_file(
    file_path: &Path,
    cfg_override: &ConfigOverride,
    component_id: &str,
) -> Result<()> {
    let url = discover_cluster_url(cfg_override)?;
    let idl_string = fetch_idl_for_component(component_id, &url)?;
    let idl: Idl = serde_json::from_str(&idl_string)?;
    let mut file = File::create(file_path)?;
    file.write_all(component_type(&idl, component_id)?.as_bytes())?;
    Ok(())
}

pub fn append_component_to_lib_rs(lib_rs_path: &Path, component_id: &str) -> Result<()> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(lib_rs_path)?;
    file.write_all(component_type_import(component_id).as_bytes())?;
    Ok(())
}
