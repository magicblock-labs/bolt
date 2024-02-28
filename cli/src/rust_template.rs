use crate::ANCHOR_VERSION;
use crate::VERSION;
use anchor_cli::Files;
use anyhow::Result;
use heck::{ToSnakeCase, ToUpperCamelCase};
use std::path::{Path, PathBuf};

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
        (program_path.join("Cargo.toml"), cargo_toml(name)),
        (program_path.join("Xargo.toml"), xargo_toml().to_string()),
    ] as Files;

    let template_files = create_system_template_simple(name, &program_path);
    anchor_cli::create_files(&[common_files, template_files].concat())
}

/// Create a component which holds position data.
fn create_component_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;

declare_id!("{}");

#[component]
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
            "@coral-xyz/anchor": "^{VERSION}"
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
        "@coral-xyz/anchor": "^{VERSION}"
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
            "@coral-xyz/anchor": "^{ANCHOR_VERSION}"
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
        "@coral-xyz/anchor": "^{ANCHOR_VERSION}"
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
        r#"const anchor = require("@coral-xyz/anchor");
const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    createInitializeNewWorldInstruction,
    FindWorldPda,
    FindWorldRegistryPda,
    Registry,
    World
}} = boltSdk;

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("InitializeNewWorld", async () => {{
      const registry = await Registry.fromAccountAddress(provider.connection, registryPda);
      worldId = new anchor.BN(registry.worlds);
      worldPda = FindWorldPda(new anchor.BN(worldId))
      const initializeWorldIx = createInitializeNewWorldInstruction(
          {{
              world: worldPda,
              registry: registryPda,
              payer: provider.wallet.publicKey,
          }});

      const tx = new anchor.web3.Transaction().add(initializeWorldIx);
      const txSign = await provider.sendAndConfirm(tx);
      console.log(`Initialized a new world (ID=${{worldId}}). Initialization signature: ${{txSign}}`);
    }});
  }});
}});
"#,
        name,
    )
}

pub fn jest(name: &str) -> String {
    format!(
        r#"const anchor = require("@coral-xyz/anchor");
const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    createInitializeNewWorldInstruction,
    FindWorldPda,
    FindWorldRegistryPda,
    Registry,
    World
}} = boltSdk;

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  const registryPda = FindWorldRegistryPda();
  let worldId: anchor.BN;
  let worldPda: PublicKey;

  it("InitializeNewWorld", async () => {{
      const registry = await Registry.fromAccountAddress(provider.connection, registryPda);
      worldId = new anchor.BN(registry.worlds);
      worldPda = FindWorldPda(new anchor.BN(worldId))
      const initializeWorldIx = createInitializeNewWorldInstruction(
          {{
              world: worldPda,
              registry: registryPda,
              payer: provider.wallet.publicKey,
          }});

      const tx = new anchor.web3.Transaction().add(initializeWorldIx);
      const txSign = await provider.sendAndConfirm(tx);
      console.log(`Initialized a new world (ID=${{worldId}}). Initialization signature: ${{txSign}}`);
    }});
  }});
"#,
        name,
    )
}

pub fn ts_mocha(name: &str) -> String {
    format!(
        r#"import * as anchor from "@coral-xyz/anchor";
import {{ Program }} from "@coral-xyz/anchor";
import {{ PublicKey }} from "@solana/web3.js";
import {{ Position }} from "../target/types/position";
import {{ Movement }} from "../target/types/movement";
import {{
    createInitializeNewWorldInstruction,
    FindWorldPda,
    FindWorldRegistryPda,
    FindEntityPda,
    Registry,
    World,
    createAddEntityInstruction,
    createInitializeComponentInstruction,
    FindComponentPda, createApplyInstruction
}} from "@magicblock-labs/bolt-sdk"
import {{expect}} from "chai";

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  const registryPda = FindWorldRegistryPda();
  let worldId: anchor.BN;
  let worldPda: PublicKey;
  let entityPda: PublicKey;

  const positionComponent = anchor.workspace.Position as Program<Position>;
  const systemMovement = anchor.workspace.Movement as Program<Movement>;

  it("InitializeNewWorld", async () => {{
        const registry = await Registry.fromAccountAddress(provider.connection, registryPda);
        worldId = new anchor.BN(registry.worlds);
        worldPda = FindWorldPda(new anchor.BN(worldId))
        const initializeWorldIx = createInitializeNewWorldInstruction(
            {{
                world: worldPda,
                registry: registryPda,
                payer: provider.wallet.publicKey,
            }});

        const tx = new anchor.web3.Transaction().add(initializeWorldIx);
        const txSign = await provider.sendAndConfirm(tx);
        console.log(`Initialized a new world (ID=${{worldId}}). Initialization signature: ${{txSign}}`);
    }});

  it("Add an entity", async () => {{
      const world = await World.fromAccountAddress(provider.connection, worldPda);
      const entityId = new anchor.BN(world.entities);
      entityPda = FindEntityPda(worldId, entityId);

      let createEntityIx = createAddEntityInstruction({{
          world: worldPda,
          payer: provider.wallet.publicKey,
          entity: entityPda,
      }});
      const tx = new anchor.web3.Transaction().add(createEntityIx);
      const txSign = await provider.sendAndConfirm(tx);
      console.log(`Initialized a new Entity (ID=${{worldId}}). Initialization signature: ${{txSign}}`);
  }});

  it("Add a component", async () => {{
      const positionComponentPda = FindComponentPda(positionComponent.programId, entityPda, "");
      let initComponentIx = createInitializeComponentInstruction({{
          payer: provider.wallet.publicKey,
          entity: entityPda,
          data: positionComponentPda,
          componentProgram: positionComponent.programId,
      }});

      const tx = new anchor.web3.Transaction().add(initComponentIx);
      const txSign = await provider.sendAndConfirm(tx);
      console.log(`Initialized a new component. Initialization signature: ${{txSign}}`);
  }});

  it("Apply a system", async () => {{
      const positionComponentPda = FindComponentPda(positionComponent.programId, entityPda, "");
      // Check that the component has been initialized and x is 0
      let positionData = await positionComponent.account.position.fetch(
          positionComponentPda
      );
      expect(positionData.x.toNumber()).to.eq(0);
      let applySystemIx = createApplyInstruction({{
          componentProgram: positionComponent.programId,
          boltSystem: systemMovement.programId,
          boltComponent: positionComponentPda,
      }}, {{args: new Uint8Array()}});

      const tx = new anchor.web3.Transaction().add(applySystemIx);
      await provider.sendAndConfirm(tx);

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
version = "0.0.1"
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
