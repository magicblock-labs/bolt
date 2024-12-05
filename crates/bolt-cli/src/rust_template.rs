use anchor_cli::rust_template::ProgramTemplate;
use anchor_cli::{create_files, Files};
use anchor_lang_idl::types::{IdlArrayLen, IdlGenericArg, IdlType};
use anyhow::Result;
use std::path::{Path, PathBuf};

use crate::templates::component::create_component_template_simple;
use crate::templates::program::{create_program_template_multiple, create_program_template_single};
use crate::templates::system::create_system_template_simple;
use crate::templates::workspace::{
    cargo_toml, cargo_toml_with_serde, workspace_manifest, xargo_toml,
};

/// Create a component from the given name.
pub fn create_component(name: &str) -> Result<()> {
    let program_path = Path::new("programs-ecs/components").join(name);
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
    let program_path = Path::new("programs-ecs/systems").join(name);
    let common_files = vec![
        (
            PathBuf::from("Cargo.toml".to_string()),
            workspace_manifest().to_string(),
        ),
        (program_path.join("Cargo.toml"), cargo_toml_with_serde(name)),
        (program_path.join("Xargo.toml"), xargo_toml().to_string()),
    ] as Files;

    let template_files = create_system_template_simple(name, &program_path);
    anchor_cli::create_files(&[common_files, template_files].concat())
}

/// Create an anchor program
pub fn create_program(name: &str, template: ProgramTemplate) -> Result<()> {
    let program_path = Path::new("programs").join(name);
    let common_files = vec![
        ("Cargo.toml".into(), workspace_manifest()),
        (program_path.join("Cargo.toml"), cargo_toml(name)),
        (program_path.join("Xargo.toml"), xargo_toml().into()),
    ];

    let template_files = match template {
        ProgramTemplate::Single => create_program_template_single(name, &program_path),
        ProgramTemplate::Multiple => create_program_template_multiple(name, &program_path),
    };

    create_files(&[common_files, template_files].concat())
}

pub fn registry_account() -> &'static str {
    r#"
{
  "pubkey": "EHLkWwAT9oebVv9ht3mtqrvHhRVMKrt54tF3MfHTey2K",
  "account": {
    "lamports": 1002240,
    "data": [
      "L65u9ri2/NoCAAAAAAAAAA==",
      "base64"
    ],
    "owner": "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n",
    "executable": false,
    "rentEpoch": 18446744073709551615,
    "space": 16
  }
}
"#
}

/// Map Idl type to rust type
pub fn convert_idl_type_to_str(ty: &IdlType) -> String {
    match ty {
        IdlType::Bool => "bool".into(),
        IdlType::U8 => "u8".into(),
        IdlType::I8 => "i8".into(),
        IdlType::U16 => "u16".into(),
        IdlType::I16 => "i16".into(),
        IdlType::U32 => "u32".into(),
        IdlType::I32 => "i32".into(),
        IdlType::F32 => "f32".into(),
        IdlType::U64 => "u64".into(),
        IdlType::I64 => "i64".into(),
        IdlType::F64 => "f64".into(),
        IdlType::U128 => "u128".into(),
        IdlType::I128 => "i128".into(),
        IdlType::U256 => "u256".into(),
        IdlType::I256 => "i256".into(),
        IdlType::Bytes => "bytes".into(),
        IdlType::String => "String".into(),
        IdlType::Pubkey => "Pubkey".into(),
        IdlType::Option(ty) => format!("Option<{}>", convert_idl_type_to_str(ty)),
        IdlType::Vec(ty) => format!("Vec<{}>", convert_idl_type_to_str(ty)),
        IdlType::Array(ty, len) => format!(
            "[{}; {}]",
            convert_idl_type_to_str(ty),
            match len {
                IdlArrayLen::Generic(len) => len.into(),
                IdlArrayLen::Value(len) => len.to_string(),
            }
        ),
        IdlType::Defined { name, generics } => generics
            .iter()
            .map(|generic| match generic {
                IdlGenericArg::Type { ty } => convert_idl_type_to_str(ty),
                IdlGenericArg::Const { value } => value.into(),
            })
            .reduce(|mut acc, cur| {
                if !acc.is_empty() {
                    acc.push(',');
                }
                acc.push_str(&cur);
                acc
            })
            .map(|generics| format!("{name}<{generics}>"))
            .unwrap_or(name.into()),
        IdlType::Generic(ty) => ty.into(),
        _ => unimplemented!("{ty:?}"),
    }
}
