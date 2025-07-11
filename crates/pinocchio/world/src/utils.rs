use crate::consts::DISCRIMATOR_LENGTH;
use core::mem::MaybeUninit;
use pinocchio::{account_info::AccountInfo, program_error::ProgramError, ProgramResult};

#[allow(clippy::type_complexity)]
pub fn init_execute_cpi_accounts<'a>(
    remaining: &'a [AccountInfo],
    ctx_accounts: &'a mut [MaybeUninit<&'a AccountInfo>],
) -> Result<(&'a [&'a AccountInfo], Option<usize>, &'a [&'a AccountInfo]), ProgramError> {
    let mut separator_idx: Option<usize> = None;
    let mut len = 0;
    let mut component_len = 0;

    #[allow(clippy::needless_range_loop)]
    for i in 0..remaining.len() {
        if separator_idx.is_some() {
            ctx_accounts[len].write(&remaining[i]);
            len += 1;
        } else if (i + 1) % 2 == 0 {
            ctx_accounts[len].write(&remaining[i]);
            component_len += 1;
            len += 1;
        } else if remaining[i].key() == &crate::ID {
            separator_idx = Some(i);
        }
    }

    let maybe_components = &ctx_accounts[..component_len];
    let maybe_remaining_accounts = &ctx_accounts[component_len..len];

    let components = unsafe {
        core::slice::from_raw_parts(
            maybe_components.as_ptr() as *const &AccountInfo,
            maybe_components.len(),
        )
    };
    let remaining_accounts = unsafe {
        core::slice::from_raw_parts(
            maybe_remaining_accounts.as_ptr() as *const &AccountInfo,
            maybe_remaining_accounts.len(),
        )
    };

    Ok((components, separator_idx, remaining_accounts))
}

pub fn assert_program_account(account_info: &AccountInfo) -> ProgramResult {
    if !account_info.is_owned_by(&crate::ID) {
        return Err(ProgramError::IllegalOwner);
    }
    Ok(())
}

pub fn assert_discriminator(account_info: &AccountInfo, discriminator: &[u8; 8]) -> ProgramResult {
    let disc = unsafe { &account_info.borrow_data_unchecked()[..DISCRIMATOR_LENGTH] };

    if disc != discriminator {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}

pub fn assert_program_account_and_discriminator(
    account_info: &AccountInfo,
    discriminator: &[u8; 8],
) -> ProgramResult {
    assert_program_account(account_info)?;
    assert_discriminator(account_info, discriminator)
}
