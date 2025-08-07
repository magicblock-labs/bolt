use anchor_cli::Files;
use anchor_lang_idl::types::{Idl, IdlDefinedFields, IdlTypeDef, IdlTypeDefGeneric, IdlTypeDefTy};
use anyhow::Result;
use heck::ToUpperCamelCase;
use std::path::Path;

use crate::rust_template::convert_idl_type_to_str; // Import the trait

/// Create a component which holds position data.
pub fn create_component_template_simple(name: &str, program_path: &Path) -> Files {
    let program_id = anchor_cli::rust_template::get_or_create_program_id(name);
    let program_name = name.to_upper_camel_case();
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            include_str!("lib.rs.template"),
            program_id = program_id,
            program_name = program_name
        ),
    )]
}

/// Automatic generation of crates from the components idl
pub fn component_type(idl: &Idl, component_id: &str) -> Result<String> {
    let component_account = idl
        .accounts
        .iter()
        .filter(|a| a.name.to_lowercase() != "entity")
        .next_back();
    let component_account =
        component_account.ok_or_else(|| anyhow::anyhow!("Component account not found in IDL"))?;

    let type_def = &idl
        .types
        .iter()
        .rfind(|ty| ty.name == component_account.name);
    let type_def = match type_def {
        Some(ty) => ty,
        None => return Err(anyhow::anyhow!("Component type not found in IDL")),
    };

    let component_name = component_account.name.to_upper_camel_case();
    println!("Component name: {}", component_name);
    let component_code = component_to_rust_code(type_def, component_id);
    let types_code = component_types_to_rust_code(&idl.types, &component_account.name);
    Ok(format!(
        r#"use bolt_lang::*;

#[component_deserialize]
{}

{}
"#,
        component_code, types_code
    ))
}

/// Convert the component type definition to rust code
fn component_to_rust_code(component: &IdlTypeDef, component_id: &str) -> String {
    let mut code = String::new();
    // Add documentation comments, if any
    for doc in &component.docs {
        code += &format!("/// {}\n", doc);
    }
    // Handle generics
    let generics = {
        let generic_names: Vec<String> = component
            .generics
            .iter()
            .map(|gen| match gen {
                IdlTypeDefGeneric::Type { name } => name.clone(),
                IdlTypeDefGeneric::Const { name, .. } => name.clone(),
            })
            .collect();
        if generic_names.is_empty() {
            "".to_string()
        } else {
            format!("<{}>", generic_names.join(", "))
        }
    };
    let composite_name = format!("Component{}", component_id);
    if let IdlTypeDefTy::Struct { fields } = &component.ty {
        code += &format!("pub struct {}{} {{\n", composite_name, generics);
        code += &*component_fields_to_rust_code(fields);
        code += "}\n\n";
        code += &format!("pub use {} as {};", composite_name, component.name);
    }
    code
}

/// Code to expose the generated type, to be added to lib.rs
pub fn component_type_import(component_id: &str) -> String {
    format!(
        r#"#[allow(non_snake_case)]
mod component_{0};
pub use component_{0}::*;
"#,
        component_id,
    )
}

/// Convert fields to rust code
fn component_fields_to_rust_code(fields: &Option<IdlDefinedFields>) -> String {
    let mut code = String::new();
    if let Some(fields) = fields {
        match fields {
            IdlDefinedFields::Named(named_fields) => {
                for field in named_fields {
                    if field.name.to_lowercase() == "bolt_metadata" {
                        continue;
                    }
                    for doc in &field.docs {
                        code += &format!("    /// {}\n", doc);
                    }
                    let field_type = convert_idl_type_to_str(&field.ty);
                    code += &format!("    pub {}: {},\n", field.name, field_type);
                }
            }
            IdlDefinedFields::Tuple(tuple_types) => {
                for (index, ty) in tuple_types.iter().enumerate() {
                    let field_type = convert_idl_type_to_str(ty);
                    code += &format!("    pub field_{}: {},\n", index, field_type);
                }
            }
        }
    }
    code
}

/// Convert the component types definition to rust code
fn component_types_to_rust_code(types: &[IdlTypeDef], component_name: &str) -> String {
    types
        .iter()
        .filter(|ty| ty.name.to_lowercase() != "boltmetadata" && ty.name != component_name)
        .map(component_type_to_rust_code)
        .collect::<Vec<_>>()
        .join("\n")
}

/// Convert the component type definition to rust code
fn component_type_to_rust_code(component_type: &IdlTypeDef) -> String {
    let mut code = String::new();
    // Add documentation comments, if any
    for doc in &component_type.docs {
        code += &format!("/// {}\n", doc);
    }
    // Handle generics
    let gen = &component_type.generics;
    let generics = {
        let generic_names: Vec<String> = gen
            .iter()
            .map(|gen| match gen {
                IdlTypeDefGeneric::Type { name } => name.clone(),
                IdlTypeDefGeneric::Const { name, .. } => name.clone(),
            })
            .collect();
        if generic_names.is_empty() {
            "".to_string()
        } else {
            format!("<{}>", generic_names.join(", "))
        }
    };
    if let IdlTypeDefTy::Struct { fields } = &component_type.ty {
        code += &format!(
            "#[component_deserialize]\n#[derive(Clone, Copy)]\npub struct {}{} {{\n",
            component_type.name, generics
        );
        code += &*component_fields_to_rust_code(fields);
        code += "}\n\n";
    }
    code
}
