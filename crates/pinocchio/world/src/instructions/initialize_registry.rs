use crate::state::{
    registry::Registry,
    transmutable::{Transmutable, TransmutableMut},
};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};
use pinocchio_system::instructions::CreateAccount;

pub fn initialize_registry(accounts: &[AccountInfo]) -> ProgramResult {
    let [registry, payer, _system_program] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    let lamports_needed = Rent::get()?.minimum_balance(Registry::LEN);

    let (_, bump) = Registry::pda();

    CreateAccount {
        from: payer,
        to: registry,
        lamports: lamports_needed,
        space: Registry::LEN as u64,
        owner: &crate::ID,
    }
    .invoke_signed(&[Registry::signer(&[bump]).as_slice().into()])?;

    let reg = unsafe { Registry::load_mut_unchecked(registry.borrow_mut_data_unchecked())? };

    reg.init()
}
