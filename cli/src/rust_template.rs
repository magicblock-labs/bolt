use crate::VERSION;
use anchor_cli::rust_template::{get_or_create_program_id, ProgramTemplate};
use anchor_cli::{create_files, Files};
use anchor_syn::idl::types::{
    Idl, IdlArrayLen, IdlDefinedFields, IdlGenericArg, IdlType, IdlTypeDef, IdlTypeDefGeneric,
    IdlTypeDefTy,
};
use anyhow::Result;
use heck::{ToSnakeCase, ToUpperCamelCase};
use std::path::{Path, PathBuf};

// Anchor CLI version
// TODO: use the stable version once the new IDL standard is released
pub const ANCHOR_CLI_VERSION: &str =
    "{ version = \"0.29.0\", git = \"https://github.com/coral-xyz/anchor.git\", rev = \"0f60909\" }";
pub const TS_ANCHOR_VERSION: &str = "0.29.1";

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
        ("Cargo.toml".into(), workspace_manifest().into()),
        (program_path.join("Cargo.toml"), cargo_toml(name)),
        (program_path.join("Xargo.toml"), xargo_toml().into()),
    ];

    let template_files = match template {
        ProgramTemplate::Single => create_program_template_single(name, &program_path),
        ProgramTemplate::Multiple => create_program_template_multiple(name, &program_path),
    };

    create_files(&[common_files, template_files].concat())
}

/// Create a component which holds position data.
fn create_component_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;

declare_id!("{}");

#[component]
#[derive(Default)]
pub struct {} {{
    pub x: i64,
    pub y: i64,
    pub z: i64,
    #[max_len(20)]
    pub description: String,
}}
"#,
            anchor_cli::rust_template::get_or_create_program_id(name),
            name.to_upper_camel_case(),
        ),
    )]
}

/// Create a system which operates on a Position component.
fn create_system_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;
use position::Position;

declare_id!("{}");

#[system]
pub mod {} {{

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {{
        let position = &mut ctx.accounts.position;
        position.x += 1;
        position.y += 1;
        Ok(ctx.accounts)
    }}

    #[system_input]
    pub struct Components {{
        pub position: Position,
    }}

}}
"#,
            anchor_cli::rust_template::get_or_create_program_id(name),
            name.to_snake_case(),
        ),
    )]
}

fn create_program_template_single(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use anchor_lang::prelude::*;

declare_id!("{}");

#[program]
pub mod {} {{
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {{
        Ok(())
    }}
}}

#[derive(Accounts)]
pub struct Initialize {{}}
"#,
            get_or_create_program_id(name),
            name.to_snake_case(),
        ),
    )]
}

/// Create a program with multiple files for instructions, state...
fn create_program_template_multiple(name: &str, program_path: &Path) -> Files {
    let src_path = program_path.join("src");
    vec![
        (
            src_path.join("lib.rs"),
            format!(
                r#"pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("{}");

#[program]
pub mod {} {{
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {{
        initialize::handler(ctx)
    }}
}}
"#,
                get_or_create_program_id(name),
                name.to_snake_case(),
            ),
        ),
        (
            src_path.join("constants.rs"),
            r#"use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";
"#
            .into(),
        ),
        (
            src_path.join("error.rs"),
            r#"use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
}
"#
            .into(),
        ),
        (
            src_path.join("instructions").join("mod.rs"),
            r#"pub mod initialize;

pub use initialize::*;
"#
            .into(),
        ),
        (
            src_path.join("instructions").join("initialize.rs"),
            r#"use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize {}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}
"#
            .into(),
        ),
        (src_path.join("state").join("mod.rs"), r#""#.into()),
    ]
}

const fn workspace_manifest() -> &'static str {
    r#"[workspace]
members = [
    "programs/*",
    "programs-ecs/components/*",
    "programs-ecs/systems/*"
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

pub fn package_json(jest: bool) -> String {
    if jest {
        format!(
            r#"{{
        "scripts": {{
            "lint:fix": "prettier */*.js \"*/**/*{{.js,.ts}}\" -w",
            "lint": "prettier */*.js \"*/**/*{{.js,.ts}}\" --check"
        }},
        "dependencies": {{
            "@magicblock-labs/anchor": "^{TS_ANCHOR_VERSION}"
        }},
        "devDependencies": {{
            "jest": "^29.0.3",
            "prettier": "^2.6.2"
        }}
    }}
    "#
        )
    } else {
        format!(
            r#"{{
    "scripts": {{
        "lint:fix": "prettier */*.js \"*/**/*{{.js,.ts}}\" -w",
        "lint": "prettier */*.js \"*/**/*{{.js,.ts}}\" --check"
    }},
    "dependencies": {{
        "@magicblock-labs/anchor": "^{TS_ANCHOR_VERSION}"
    }},
    "devDependencies": {{
        "chai": "^4.3.4",
        "mocha": "^9.0.3",
        "prettier": "^2.6.2",
        "@metaplex-foundation/beet": "^0.7.1",
        "@metaplex-foundation/beet-solana": "^0.4.0",
         "@magicblock-labs/bolt-sdk": "latest"
    }}
}}
"#
        )
    }
}

pub fn ts_package_json(jest: bool) -> String {
    if jest {
        format!(
            r#"{{
        "scripts": {{
            "lint:fix": "prettier */*.js \"*/**/*{{.js,.ts}}\" -w",
            "lint": "prettier */*.js \"*/**/*{{.js,.ts}}\" --check"
        }},
        "dependencies": {{
            "@magicblock-labs/anchor": "^{TS_ANCHOR_VERSION}"
        }},
        "devDependencies": {{
            "@types/bn.js": "^5.1.0",
            "@types/jest": "^29.0.3",
            "jest": "^29.0.3",
            "prettier": "^2.6.2",
            "ts-jest": "^29.0.2",
            "typescript": "^4.3.5",
            "@metaplex-foundation/beet": "^0.7.1",
            "@metaplex-foundation/beet-solana": "^0.4.0",
            "@magicblock-labs/bolt-sdk": "latest"
        }}
    }}
    "#
        )
    } else {
        format!(
            r#"{{
    "scripts": {{
        "lint:fix": "prettier */*.js \"*/**/*{{.js,.ts}}\" -w",
        "lint": "prettier */*.js \"*/**/*{{.js,.ts}}\" --check"
    }},
    "dependencies": {{
        "@magicblock-labs/anchor": "^{TS_ANCHOR_VERSION}"
    }},
    "devDependencies": {{
        "chai": "^4.3.4",
        "mocha": "^9.0.3",
        "ts-mocha": "^10.0.0",
        "@types/bn.js": "^5.1.0",
        "@types/chai": "^4.3.0",
        "@types/mocha": "^9.0.0",
        "typescript": "^4.3.5",
        "prettier": "^2.6.2",
        "@metaplex-foundation/beet": "^0.7.1",
        "@metaplex-foundation/beet-solana": "^0.4.0",
        "@magicblock-labs/bolt-sdk": "latest"
    }}
}}
"#
        )
    }
}

pub fn mocha(name: &str) -> String {
    format!(
        r#"const anchor = require("@magicblock-labs/anchor");
const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    InitializeNewWorld,
}} = boltSdk;

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("InitializeNewWorld", async () => {{
    const initNewWorld = await InitializeNewWorld({{
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    }});
    const txSign = await provider.sendAndConfirm(initNewWorld.transaction);
    console.log(`Initialized a new world (ID=${{initNewWorld.worldPda}}). Initialization signature: ${{txSign}}`);
    }});
  }});
}});
"#,
        name,
    )
}

pub fn jest(name: &str) -> String {
    format!(
        r#"const anchor = require("@magicblock-labs/anchor");
const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    InitializeNewWorld,
}} = boltSdk;

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  let worldPda: PublicKey;

  it("InitializeNewWorld", async () => {{
    const initNewWorld = await InitializeNewWorld({{
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    }});
    const txSign = await provider.sendAndConfirm(initNewWorld.transaction);
    worldPda = initNewWorld.worldPda;
    console.log(`Initialized a new world (ID=${{worldPda}}). Initialization signature: ${{txSign}}`);
    }});
  }});
"#,
        name,
    )
}

pub fn ts_mocha(name: &str) -> String {
    format!(
        r#"import * as anchor from "@magicblock-labs/anchor";
import {{ Program }} from "@magicblock-labs/anchor";
import {{ PublicKey }} from "@solana/web3.js";
import {{ Position }} from "../target/types/position";
import {{ Movement }} from "../target/types/movement";
import {{
    InitializeNewWorld,
    AddEntity,
    InitializeComponent,
    ApplySystem,
    FindComponentPda,
}} from "@magicblock-labs/bolt-sdk"
import {{expect}} from "chai";

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  let worldPda: PublicKey;
  let entityPda: PublicKey;

  const positionComponent = anchor.workspace.Position as Program<Position>;
  const systemMovement = anchor.workspace.Movement as Program<Movement>;

  it("InitializeNewWorld", async () => {{
    const initNewWorld = await InitializeNewWorld({{
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    }});
    const txSign = await provider.sendAndConfirm(initNewWorld.transaction);
    worldPda = initNewWorld.worldPda;
    console.log(`Initialized a new world (ID=${{worldPda}}). Initialization signature: ${{txSign}}`);
  }});

  it("Add an entity", async () => {{
      const addEntity = await AddEntity({{
        payer: provider.wallet.publicKey,
        world: worldPda,
        connection: provider.connection,
      }});
      const txSign = await provider.sendAndConfirm(addEntity.transaction);
      entityPda = addEntity.entityPda;
      console.log(`Initialized a new Entity (ID=${{addEntity.entityId}}). Initialization signature: ${{txSign}}`);
  }});

  it("Add a component", async () => {{
      const initComponent = await InitializeComponent({{
          payer: provider.wallet.publicKey,
          entity: entityPda,
          componentId: positionComponent.programId,
      }});
      const txSign = await provider.sendAndConfirm(initComponent.transaction);
      console.log(`Initialized the grid component. Initialization signature: ${{txSign}}`);
  }});

  it("Apply a system", async () => {{
      const positionComponentPda = FindComponentPda(positionComponent.programId, entityPda);
      // Check that the component has been initialized and x is 0
      let positionData = await positionComponent.account.position.fetch(
          positionComponentPda
      );

      const applySystem = await ApplySystem({{
        authority: provider.wallet.publicKey,
        system: systemMovement.programId,
        entity: entityPda,
        components: [positionComponent.programId],
      }});
      const txSign = await provider.sendAndConfirm(applySystem.transaction);
      console.log(`Applied a system. Signature: ${{txSign}}`);

      // Check that the system has been applied and x is > 0
      positionData = await positionComponent.account.position.fetch(
          positionComponentPda
      );
      expect(positionData.x.toNumber()).to.gt(0);
  }});

}});
"#,
        name.to_upper_camel_case(),
    )
}

fn cargo_toml(name: &str) -> String {
    format!(
        r#"[package]
name = "{0}"
version = "{2}"
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
idl-build = ["anchor-lang/idl-build"]

[dependencies]
bolt-lang = "{2}"
anchor-lang = {3}
"#,
        name,
        name.to_snake_case(),
        VERSION,
        // Todo use stable version once new IDL standard is released
        //anchor_cli::VERSION,
        ANCHOR_CLI_VERSION
    )
}

/// TODO: Remove serde dependency
fn cargo_toml_with_serde(name: &str) -> String {
    format!(
        r#"[package]
name = "{0}"
version = "{2}"
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
idl-build = ["anchor-lang/idl-build"]

[dependencies]
bolt-lang = "{2}"
anchor-lang = {3}
serde = {{ version = "1.0", features = ["derive"] }}
"#,
        name,
        name.to_snake_case(),
        VERSION,
        // Todo use stable version once new IDL standard is released
        //anchor_cli::VERSION,
        ANCHOR_CLI_VERSION
    )
}

fn xargo_toml() -> &'static str {
    r#"[target.bpfel-unknown-unknown.dependencies.std]
features = []
"#
}
pub fn git_ignore() -> &'static str {
    r#"
.anchor
.bolt
.DS_Store
target
**/*.rs.bk
node_modules
test-ledger
.yarn
"#
}

pub fn prettier_ignore() -> &'static str {
    r#"
.anchor
.bolt
.DS_Store
target
node_modules
dist
build
test-ledger
"#
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

/// Automatic generation of crates from the components idl

pub fn component_type(idl: &Idl, component_id: &str) -> Result<String> {
    let component_account = idl
        .accounts
        .iter()
        .filter(|a| a.name.to_lowercase() != "Entity")
        .last();
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
    let component_code = component_to_rust_code(type_def, component_id);
    let types_code = component_types_to_rust_code(&idl.types, &component_account.name);
    Ok(format!(
        r#"use bolt_lang::*;

#[component_deserialize]
#[derive(Clone, Copy)]
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
    }
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

pub(crate) fn types_cargo_toml() -> String {
    let name = "bolt-types";
    format!(
        r#"[package]
name = "{0}"
version = "{2}"
description = "Autogenerate types for the bolt language"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "{1}"

[dependencies]
bolt-lang = "{2}"
anchor-lang = {3}
"#,
        name,
        name.to_snake_case(),
        VERSION,
        // TODO: use the stable version once the new IDL standard is released
        //anchor_cli::VERSION,
        ANCHOR_CLI_VERSION
    )
}
