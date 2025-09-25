use anchor_lang::prelude::*;
use crate::borsh::BorshDeserialize;

pub fn initialize<'info, T: Default + AccountSerialize + AccountDeserialize + BorshDeserialize + Clone>(cpi_auth: &AccountInfo<'info>, bolt_component: &mut Account<'info, T>) -> Result<()> {
    crate::cpi::check(cpi_auth)?;
    bolt_component.set_inner(<T>::default());
    Ok(())
}