use pinocchio::{account_info::AccountInfo, program_error::ProgramError, ProgramResult};

pub fn destroy_component(accounts: &[AccountInfo]) -> ProgramResult {
    let [authority, receiver, component_program, component_program_data, entity, component, instruction_sysvar_account, system_program] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    bolt_cpi_interface::component::Destroy {
        authority,
        component_program_data,
        component,
        component_program: component_program.key(),
        receiver,
        entity,
        instruction_sysvar_account,
        system_program,
    }
    .invoke()
}
