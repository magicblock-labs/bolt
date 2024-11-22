use crate::VERSION;
use heck::{ToSnakeCase, ToUpperCamelCase};
pub const ANCHOR_VERSION: &str = anchor_cli::VERSION;

pub const fn workspace_manifest() -> &'static str {
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
        r#"{
        "scripts": {
            "lint:fix": "node_modules/.bin/prettier */*.js \"*/**/*{.js,.ts}\" -w",
            "lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check"
        },
        "devDependencies": {
            "jest": "^29.0.3",
            "prettier": "^2.6.2",
            "@magicblock-labs/bolt-sdk": "latest"
        }
    }
    "#
        .to_string()
    } else {
        r#"{
    "scripts": {
        "lint:fix": "node_modules/.bin/prettier */*.js \"*/**/*{.js,.ts}\" -w",
        "lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check"
    },
    "devDependencies": {
        "chai": "^4.3.4",
        "mocha": "^9.0.3",
        "prettier": "^2.6.2",
        "@metaplex-foundation/beet": "^0.7.1",
        "@metaplex-foundation/beet-solana": "^0.4.0",
        "@magicblock-labs/bolt-sdk": "latest"
    }
}
"#
        .to_string()
    }
}

pub fn ts_package_json(jest: bool) -> String {
    if jest {
        r#"{
        "scripts": {
            "lint:fix": "node_modules/.bin/prettier */*.js \"*/**/*{.js,.ts}\" -w",
            "lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check"
        },
        "devDependencies": {
            "@types/bn.js": "^5.1.0",
            "@types/jest": "^29.0.3",
            "jest": "^29.0.3",
            "prettier": "^2.6.2",
            "ts-jest": "^29.0.2",
            "typescript": "^4.3.5",
            "@metaplex-foundation/beet": "^0.7.1",
            "@metaplex-foundation/beet-solana": "^0.4.0",
            "@magicblock-labs/bolt-sdk": "latest"
        }
    }
    "#
        .to_string()
    } else {
        r#"{
    "scripts": {
        "lint:fix": "node_modules/.bin/prettier */*.js \"*/**/*{.js,.ts}\" -w",
        "lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check"
    },
    "devDependencies": {
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
    }
}
"#
        .to_string()
    }
}

pub fn mocha(name: &str) -> String {
    format!(
        r#"const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    InitializeNewWorld,
    anchor,
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
        r#"const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    InitializeNewWorld,
    anchor,
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
        r#"import {{ PublicKey }} from "@solana/web3.js";
import {{ Position }} from "../target/types/position";
import {{ Movement }} from "../target/types/movement";
import {{
    InitializeNewWorld,
    AddEntity,
    InitializeComponent,
    ApplySystem,
    anchor,
    Program
}} from "@magicblock-labs/bolt-sdk"
import {{expect}} from "chai";

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  let worldPda: PublicKey;
  let entityPda: PublicKey;
  let componentPda: PublicKey;

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
    const initializeComponent = await InitializeComponent({{
      payer: provider.wallet.publicKey,
      entity: entityPda,
      componentId: positionComponent.programId,
    }});
    const txSign = await provider.sendAndConfirm(initializeComponent.transaction);
    componentPda = initializeComponent.componentPda;
    console.log(`Initialized the grid component. Initialization signature: ${{txSign}}`);
  }});

  it("Apply a system", async () => {{
    // Check that the component has been initialized and x is 0
    const positionBefore = await positionComponent.account.position.fetch(
      componentPda
    );
    expect(positionBefore.x.toNumber()).to.equal(0);

    // Run the movement system
    const applySystem = await ApplySystem({{
      authority: provider.wallet.publicKey,
      systemId: systemMovement.programId,
      world: worldPda,
      entities: [{{
        entity: entityPda,
        components: [{{ componentId: positionComponent.programId }}],
      }}]
    }});
    const txSign = await provider.sendAndConfirm(applySystem.transaction);
    console.log(`Applied a system. Signature: ${{txSign}}`);

    // Check that the system has been applied and x is > 0
    const positionAfter = await positionComponent.account.position.fetch(
      componentPda
    );
    expect(positionAfter.x.toNumber()).to.gt(0);
  }});

}});
"#,
        name.to_upper_camel_case(),
    )
}

pub fn cargo_toml(name: &str) -> String {
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
anchor-lang = "{3}"
"#,
        name,
        name.to_snake_case(),
        VERSION,
        ANCHOR_VERSION
    )
}

/// TODO: Remove serde dependency
pub fn cargo_toml_with_serde(name: &str) -> String {
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
anchor-lang = "{3}"
serde = {{ version = "1.0", features = ["derive"] }}
"#,
        name,
        name.to_snake_case(),
        VERSION,
        ANCHOR_VERSION
    )
}

pub fn xargo_toml() -> &'static str {
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
anchor-lang = "{3}"
"#,
        name,
        name.to_snake_case(),
        VERSION,
        ANCHOR_VERSION
    )
}
