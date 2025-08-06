use crate::prelude::*;
use crate::BoltError;

pub fn checker<'info>(cpi_auth: &AccountInfo<'info>) -> Result<()> {
    if !cpi_auth.is_signer || cpi_auth.key != &crate::world::World::cpi_auth_address() {
        return Err(BoltError::InvalidCaller.into());
    }
    Ok(())
}
