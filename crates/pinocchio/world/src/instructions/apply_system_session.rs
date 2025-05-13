use crate::{error::WorldError, state::world::WorldRef, utils::init_execute_cpi_accounts};
use core::mem::MaybeUninit;
use pinocchio::{
    account_info::AccountInfo,
    cpi::{get_return_data, MAX_CPI_ACCOUNTS},
    program_error::ProgramError,
    ProgramResult,
};

pub fn apply_system_session(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let [system, authority, instruction_sysvar_account, world_acct, session_token, remaining @ ..] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    if !authority.is_signer() && authority.key() != &crate::ID {
        return Err(WorldError::InvalidAuthority.into());
    }

    let world = WorldRef::from_account_info(world_acct)?;

    if !world.permissionless()? && world.systems.binary_search(system.key()).is_err() {
        return Err(WorldError::SystemNotApproved.into());
    }

    const UNINIT_INFO: MaybeUninit<&AccountInfo> = MaybeUninit::uninit();

    let mut ctx_accounts = [UNINIT_INFO; MAX_CPI_ACCOUNTS];

    let (components, sep_idx, remaining_accounts) =
        init_execute_cpi_accounts(remaining, &mut ctx_accounts)?;

    bolt_cpi_interface::system::Execute {
        authority,
        components,
        remaining_accounts,
        instruction_data: data,
        system: system.key(),
    }
    .invoke()?;

    let return_data = get_return_data().ok_or(ProgramError::InvalidAccountData)?;

    let components_pair = &remaining[..sep_idx.unwrap_or(remaining.len())];

    let (result_len_bytes, data) = return_data.as_slice().split_at(core::mem::size_of::<u32>());

    let result_len =
        u32::from_le_bytes(unsafe { (result_len_bytes.as_ptr() as *const [u8; 4]).read() });

    if result_len as usize != components_pair.len().saturating_div(2) {
        return Err(WorldError::InvalidSystemOutput.into());
    }

    let mut cursor = 0;

    for pair in components_pair.chunks_exact(2) {
        let [component_program, component] = pair else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let mut size = core::mem::size_of::<u32>();

        let len_bytes = &data[cursor..cursor + size];

        let len =
            u32::from_le_bytes(unsafe { (len_bytes.as_ptr() as *const [u8; 4]).read() }) as usize;

        size += len;

        bolt_cpi_interface::component::UpdateWithSession {
            authority,
            component,
            component_program: component_program.key(),
            instruction_data: &data[cursor..cursor + size],
            instruction_sysvar_account,
            session_token,
        }
        .invoke()?;

        cursor += size;
    }

    Ok(())
}
