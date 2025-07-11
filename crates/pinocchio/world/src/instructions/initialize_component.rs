use crate::error::WorldError;
use pinocchio::{account_info::AccountInfo, program_error::ProgramError, ProgramResult};

pub fn initialize_component(accounts: &[AccountInfo]) -> ProgramResult {
    let [payer, data, entity, component_program, authority, instruction_sysvar_account, system_program] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    if !authority.is_signer() && authority.key() != &crate::ID {
        return Err(WorldError::InvalidAuthority.into());
    }

    bolt_cpi_interface::component::Initialize {
        payer,
        authority,
        component_program: component_program.key(),
        data,
        entity,
        instruction_sysvar_account,
        system_program,
    }
    .invoke()
}
