# bolt-lang

Rust primitives for building fully on-chain games and autonomous worlds on Solana using the [Bolt](https://github.com/magicblock-labs/bolt) framework.

## Overview

`bolt-lang` is the core library for the Bolt Entity Component System (ECS) framework. It provides macros and types for defining **components** (data) and **systems** (logic) that run on the Solana blockchain.

## Features

- **`#[component]`** -- Define on-chain data components with automatic PDA derivation and serialization.
- **`#[system]`** -- Define systems that operate on components, enforced through CPI.
- **`#[system_input]`** -- Declare which components a system reads and writes.
- **`#[arguments]`** -- Define typed arguments passed to systems at runtime.
- **`#[bolt_program]`** -- Annotate Anchor programs to integrate with the Bolt world.
- **`#[delegate]`** -- Enable account delegation for transaction acceleration via MagicBlock's ephemeral rollups.
- **Session keys** -- Re-exported from `session-keys` for gasless player interactions.

## Installation

Add `bolt-lang` to your `Cargo.toml`:

```toml
[dependencies]
bolt-lang = "0.2"
```

Or use the Bolt CLI to scaffold a new project:

```bash
bolt init my-project
```

## Quick Example

Define a component:

```rust
use bolt_lang::*;

#[component]
pub struct Position {
    pub x: i64,
    pub y: i64,
    pub z: i64,
}
```

Define a system:

```rust
use bolt_lang::*;

#[system]
pub mod movement {
    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {
        let position = &mut ctx.accounts.position;
        position.x += args.dx;
        position.y += args.dy;
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub position: Position,
    }

    #[arguments]
    pub struct Args {
        pub dx: i64,
        pub dy: i64,
    }
}
```

## Documentation

- [Bolt Book](https://book.boltengine.gg) -- Tutorials and guides
- [API Reference](https://docs.rs/bolt-lang) -- Generated API documentation
- [MagicBlock Docs](https://docs.magicblock.gg) -- Platform documentation

## License

MIT
