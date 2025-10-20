use world::program::World;

use crate::prelude::*;
use crate::BoltError;

#[inline(always)]
pub fn check(instruction_sysvar_account: &AccountInfo<'_>) -> Result<()> {
    let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(0, &instruction_sysvar_account.to_account_info()).map_err(|_| BoltError::InvalidCaller)?;
    require_eq!(instruction.program_id, World::id(),  BoltError::InvalidCaller);
    Ok(())
}
