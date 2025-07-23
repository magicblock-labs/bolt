<div align="center">

  <img height="170x" src="https://book.boltengine.gg/images/bolt.png" />
  

  <h1>Bolt</h1>

  <p>
    <strong>A high-performance and composable SVM-based framework for Fully On-chain games and Autonomous Worlds. </strong>
  </p>

  <p>
    <a href="https://book.boltengine.gg"><img alt="Tutorials" src="https://img.shields.io/badge/docs-tutorials-blueviolet" /></a>
    <a href="https://github.com/magicblock-labs/bolt/issues"><img alt="Issues" src="https://img.shields.io/github/issues/magicblock-labs/bolt?color=blueviolet" /></a>
    <a href="https://discord.com/invite/MBkdC3gxcv"><img alt="Discord Chat" src="https://img.shields.io/discord/943797222162726962?color=blueviolet" /></a>
    <a href="https://opensource.org/licenses/MIT"><img alt="License" src="https://img.shields.io/github/license/magicblock-labs/bolt?color=blueviolet" /></a>
  </p>

</div>

Bolt is a high-performance, scalable SVM-based framework designed for Fully On Chain (FOC) Games and Autonomous Worlds.

With Bolt, you can create games that live forever on the blockchain. These games are platform-centric by default, empowering users to extend and modify both game content and logic. The framework incorporates an Entity Component System (ECS) architecture, streamlining the game structuring and assembly process and providing ready-to-use components. Developers can reuse and contribute modules and logic deployed on the blockchain.

## Packages

| Package                     | Description                                                                      | Version                                                                                                                                  | Docs                                                                                                            |
|:----------------------------|:---------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------|
| `bolt-cli`                  | CLI to support building and managing a Bolt workspace                            | [![Crates.io](https://img.shields.io/crates/v/bolt-cli?color=blue)](https://crates.io/crates/bolt-cli)                                 | [![Docs](https://img.shields.io/badge/docs-tutorials-blue)](https://book.boltengine.gg/getting_started/installation.html) |
| `bolt-lang`                 | Rust primitives for creating components, systems and writing programs on Solana | [![Crates.io](https://img.shields.io/crates/v/bolt-lang?color=blue)](https://crates.io/crates/bolt-lang)                                 | [![Docs.rs](https://img.shields.io/badge/docs-tutorials-blue)](https://book.boltengine.gg/)                                    |
| `@magicblock-labs/bolt-sdk` | TypeScript client for Anchor programs                                            | [![npm](https://img.shields.io/npm/v/@magicblock-labs/bolt-sdk.svg?color=blue)](https://www.npmjs.com/package/@magicblock-labs/bolt-sdk)         | [![Docs](https://img.shields.io/badge/docs-tutorials-blue)](https://book.boltengine.gg/getting_started/world_program.html#typescript-sdk-installation)     |
| `@magicblock-labs/ephemeral-validator` | MagicBlock's extremely fast Solana compatible validator | [![npm](https://img.shields.io/npm/v/@magicblock-labs/ephemeral-validator.svg?color=blue)](https://www.npmjs.com/package/@magicblock-labs/ephemeral-validator) | [![Docs](https://img.shields.io/badge/docs-tutorials-blue)](https://docs.magicblock.gg/pages/tools/bolt/introduction) |

## ⚡️ Requirements

Make sure to have the latest nightly toolchain, which is required to generate IDLs.
```bash
rustup update nightly
```

## ⚡️ Installing the bolt-cli

```bash
cargo install bolt-cli
```

## ⚡️ (Optional) Installing the ephemeral-validator

To enable transaction acceleration on LocalNet, you can install MagicBlock's `ephemeral-validator`:

```bash
npm install -g @magicblock-labs/ephemeral-validator
```

## 🔩️ Getting Started

Create a project with the bolt-cli:

```bash
bolt init new-project
```

Run the tests for the generated example project:

```bash
cd new-project
bolt test
```

## 📘 Bolt docs

Read the Bolt [docs](https://docs.magicblock.gg/BOLT/Introduction/introduction)


## 🚧 Under construction

Bolt is in active development, so all APIs are subject to change.
This code is unaudited. Use at your own risk.

## 💚 Open Source

Open Source is at the heart of what we do at Magicblock. We believe building software in the open, with thriving communities, helps leave the world a little better than we found it.


## ✨ Contributors & Community

Thank you for your interest in contributing to Bolt!
Please see the [CONTRIBUTING.md](./docs/CONTRIBUTING.md) to learn how.

