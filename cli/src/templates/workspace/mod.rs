use crate::VERSION;
use heck::ToSnakeCase;
pub const ANCHOR_VERSION: &str = anchor_cli::VERSION;

pub fn workspace_manifest() -> String {
    format!(
        include_str!("workspace.toml"),
        VERSION = VERSION,
        ANCHOR_VERSION = ANCHOR_VERSION
    )
}

pub fn package_json(jest: bool) -> String {
    if jest {
        include_str!("jest.package.json").to_string()
    } else {
        include_str!("package.json").to_string()
    }
}

pub fn ts_package_json(jest: bool) -> String {
    if jest {
        include_str!("jest.ts.package.json").to_string()
    } else {
        include_str!("ts.package.json").to_string()
    }
}

pub fn mocha(name: &str) -> String {
    format!(include_str!("mocha.js"), name)
}

pub fn jest(name: &str) -> String {
    format!(include_str!("jest.js"), name)
}

pub fn ts_mocha(name: &str) -> String {
    format!(include_str!("mocha.ts"), name)
}

pub fn cargo_toml(name: &str) -> String {
    let snake_case_name = name.to_snake_case();
    format!(
        include_str!("Cargo.toml"),
        name = name,
        snake_case_name = snake_case_name,
        VERSION = VERSION
    )
}

/// TODO: Remove serde dependency
pub fn cargo_toml_with_serde(name: &str) -> String {
    let snake_case_name = name.to_snake_case();
    format!(
        include_str!("Cargo.serde.toml"),
        name = name,
        snake_case_name = snake_case_name,
        VERSION = VERSION
    )
}

pub fn xargo_toml() -> &'static str {
    include_str!("Xargo.toml")
}
pub fn git_ignore() -> &'static str {
    include_str!("gitignore")
}

pub fn prettier_ignore() -> &'static str {
    include_str!("prettierignore")
}

pub(crate) fn types_cargo_toml() -> String {
    let name = "bolt-types";
    let snake_case_name = name.to_snake_case();
    format!(
        include_str!("types.Cargo.toml"),
        name = name,
        snake_case_name = snake_case_name,
        VERSION = VERSION
    )
}
