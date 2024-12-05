pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("{program_id}");

#[program]
pub mod {program_name} {{
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {{
        initialize::handler(ctx)
    }}
}}
