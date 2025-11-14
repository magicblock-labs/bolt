use crate::prelude::*;

pub fn set_owner<'info>(
    instruction_sysvar_account: &AccountInfo<'info>,
    component: &AccountInfo<'info>,
    owner: Pubkey,
) -> Result<()> {
    crate::cpi::check(instruction_sysvar_account)?;
    component.realloc(0, false)?;
    component.assign(&owner);
    Ok(())
}