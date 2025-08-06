use crate::prelude::*;

pub fn set_owner<'info>(cpi_auth: AccountInfo<'info>, component: AccountInfo<'info>, owner: Pubkey) -> Result<()> {
    crate::cpi::checker(&cpi_auth)?;
    component.realloc(0, false)?;
    component.assign(&owner);
    Ok(())
}
