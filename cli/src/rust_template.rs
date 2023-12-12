use crate::VERSION;
use anchor_cli::Files;
use anyhow::Result;
use heck::{ToKebabCase, ToSnakeCase, ToUpperCamelCase};
use std::path::{Path, PathBuf};

/// Create a component from the given name.
pub fn create_component(name: &str) -> Result<()> {
    let program_path = Path::new("programs").join(name);
    let common_files = vec![
        (
            PathBuf::from("Cargo.toml".to_string()),
            workspace_manifest().to_string(),
        ),
        (program_path.join("Cargo.toml"), cargo_toml(name)),
        (program_path.join("Xargo.toml"), xargo_toml().to_string()),
    ] as Files;

    let template_files = create_component_template_simple(name, &program_path);
    anchor_cli::create_files(&[common_files, template_files].concat())
}

/// Create a system from the given name.
pub(crate) fn create_system(name: &str) -> Result<()> {
    let program_path = Path::new("programs").join(name);
    let common_files = vec![
        (
            PathBuf::from("Cargo.toml".to_string()),
            workspace_manifest().to_string(),
        ),
        (program_path.join("Cargo.toml"), cargo_toml(name)),
        (program_path.join("Xargo.toml"), xargo_toml().to_string()),
    ] as Files;

    let template_files = create_system_template_simple(name, &program_path);
    anchor_cli::create_files(&[common_files, template_files].concat())
}

/// Create a program with a single `lib.rs` file.
fn create_component_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;

declare_id!("{}");

#[component({})]
#[program]
pub mod {} {{
    use super::*;
}}

#[account]
#[bolt_account(component_id = "{}")]
#[derive(Copy)]
pub struct {} {{
    pub x: i64,
    pub y: i64,
    pub z: i64,
}}
"#,
            anchor_cli::rust_template::get_or_create_program_id(name),
            name.to_upper_camel_case(),
            name.to_snake_case(),
            name.to_kebab_case(),
            name.to_upper_camel_case(),
        ),
    )]
}

/// Create a program with a single `lib.rs` file.
fn create_system_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;

declare_id!("{}");

#[system]
#[program]
pub mod {} {{
    use super::*;

    pub fn execute(ctx: Context<Component>, args: Vec<u8>) -> Result<Position> {{

        let mut position = Position::from_account_info(&ctx.accounts.position)?;
        position.x += 1;

        Ok(position)
    }}
}}

// Define the Account to parse from the component
#[derive(Accounts)]
pub struct Component<'info> {{
    /// CHECK: check that the component is the expected account
    pub position: AccountInfo<'info>,
}}

#[component_deserialize]
pub struct Position {{
    pub x: i64,
    pub y: i64,
    pub z: i64,
}}
"#,
            anchor_cli::rust_template::get_or_create_program_id(name),
            name.to_snake_case(),
        ),
    )]
}

const fn workspace_manifest() -> &'static str {
    r#"[workspace]
members = [
    "programs/*"
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
"#
}

fn cargo_toml(name: &str) -> String {
    format!(
        r#"[package]
name = "{0}"
version = "0.1.0"
description = "Created with Bolt"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "{1}"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
bolt-lang = "{2}"
anchor-lang = "{3}"
"#,
        name,
        name.to_snake_case(),
        VERSION,
        anchor_cli::VERSION,
    )
}

fn xargo_toml() -> &'static str {
    r#"[target.bpfel-unknown-unknown.dependencies.std]
features = []
"#
}
