use crate::borsh::BorshDeserialize;
use crate::world;
use crate::{cpi::check, errors::BoltError};
use anchor_lang::prelude::*;
use session_keys::SessionToken;

pub fn update<'info, T: AccountSerialize + AccountDeserialize + BorshDeserialize + Clone>(
    cpi_auth: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    component_authority: Pubkey,
    bolt_component: &mut Account<'info, T>,
    data: &[u8],
) -> Result<()> {
    require!(
        component_authority == world::id_const()
            || (component_authority == *authority.key && authority.is_signer),
        BoltError::InvalidAuthority
    );
    check(&cpi_auth.to_account_info())?;
    bolt_component.set_inner(<T>::try_from_slice(data)?);
    Ok(())
}

pub fn update_with_session<
    'info,
    T: AccountSerialize + AccountDeserialize + BorshDeserialize + Clone,
>(
    cpi_auth: &AccountInfo<'info>,
    authority: &Signer<'info>,
    component_authority: Pubkey,
    bolt_component: &mut Account<'info, T>,
    session_token: &Account<'info, SessionToken>,
    data: &[u8],
) -> Result<()> {
    if component_authority == world::id_const() {
        require!(
            Clock::get()?.unix_timestamp < session_token.valid_until,
            crate::session_keys::SessionError::InvalidToken
        );
    } else {
        let validity_ctx = crate::session_keys::ValidityChecker {
            session_token: session_token.clone(),
            session_signer: authority.clone(),
            authority: component_authority,
            target_program: world::id_const(),
        };
        require!(
            session_token.validate(validity_ctx)?,
            crate::session_keys::SessionError::InvalidToken
        );
        require_eq!(
            component_authority,
            session_token.authority,
            crate::session_keys::SessionError::InvalidToken
        );
    }

    crate::cpi::check(&cpi_auth.to_account_info())?;

    bolt_component.set_inner(<T>::try_from_slice(data)?);
    Ok(())
}
