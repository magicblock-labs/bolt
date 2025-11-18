
use crate::{BoltMetadata, prelude::*};

pub fn recover_metadata<'info>(
    instruction_sysvar_account: &AccountInfo<'info>,
    component: &AccountInfo<'info>,
    original_size: u32,
    discriminator: Vec<u8>,
    bolt_metadata: BoltMetadata,
) -> Result<()> {
    crate::cpi::check(instruction_sysvar_account)?;
    component.realloc(original_size as usize, false)?;
    let mut account_data = component.try_borrow_mut_data()?;
    account_data[0..8].copy_from_slice(&discriminator);
    account_data[8..8 + BoltMetadata::INIT_SPACE].copy_from_slice(&bolt_metadata.try_to_vec()?);
    Ok(())
}