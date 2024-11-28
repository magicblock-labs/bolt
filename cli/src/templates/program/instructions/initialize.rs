use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize {}

pub fn handler(_ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}
