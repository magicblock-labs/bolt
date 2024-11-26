use anchor_lang::prelude::*;

declare_id!("{program_id}");

#[program]
pub mod {program_name} {{
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {{
        Ok(())
    }}
}}

#[derive(Accounts)]
pub struct Initialize {{}}
