use anchor_lang::prelude::*;

use crate::BoltError;

pub fn destroy<'info>(
    program_id: &Pubkey,
    cpi_auth: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    component_program_data: &AccountInfo<'info>,
    component_authority: Pubkey,
) -> Result<()> {
    let pda = Pubkey::find_program_address(
        &[program_id.as_ref()],
        &crate::prelude::solana_program::bpf_loader_upgradeable::id(),
    )
    .0;

    if !pda.eq(component_program_data.key) {
        return Err(BoltError::InvalidAuthority.into());
    }

    let program_account_data = component_program_data.try_borrow_data()?;
    let upgrade_authority = if let crate::prelude::solana_program::bpf_loader_upgradeable::UpgradeableLoaderState::ProgramData {
        upgrade_authority_address,
        ..
    } =
        crate::prelude::bincode::deserialize(&program_account_data).map_err(|_| BoltError::InvalidAuthority)?
    {
        Ok(upgrade_authority_address)
    } else {
        Err(anchor_lang::error::Error::from(BoltError::InvalidAuthority))
    }?.ok_or(BoltError::InvalidAuthority)?;

    if authority.key != &component_authority && authority.key != &upgrade_authority {
        return Err(BoltError::InvalidAuthority.into());
    }

    crate::cpi::check(&cpi_auth.to_account_info())
}
