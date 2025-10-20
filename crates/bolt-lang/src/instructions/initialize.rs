use crate::borsh::BorshDeserialize;
use anchor_lang::prelude::*;

pub fn initialize<
    'info,
    T: Default + AccountSerialize + AccountDeserialize + BorshDeserialize + Clone,
>(
    instruction_sysvar_account: &AccountInfo<'info>,
    bolt_component: &mut Account<'info, T>,
) -> Result<()> {
    crate::cpi::check(instruction_sysvar_account)?;
    bolt_component.set_inner(<T>::default());
    Ok(())
}
