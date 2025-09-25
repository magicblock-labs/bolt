use crate::prelude::*;
use crate::BoltError;

#[inline(always)]
pub fn check(cpi_auth: &AccountInfo<'_>) -> Result<()> {
    if !cpi_auth.is_signer || *cpi_auth.key != crate::world::World::cpi_auth_address() {
        return Err(BoltError::InvalidCaller.into());
    }
    Ok(())
}