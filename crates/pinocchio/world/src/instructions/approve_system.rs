use crate::{error::WorldError, state::world::WorldMut};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

pub fn approve_system(accounts: &[AccountInfo]) -> ProgramResult {
    let [authority, world_acct, system, _system_program] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    if !authority.is_signer() {
        return Err(WorldError::InvalidAuthority.into());
    }

    let mut world = WorldMut::from_account_info(world_acct)?;

    let authorities = world.authorities()?;

    if !authorities.contains(authority.key()) {
        return Err(WorldError::InvalidAuthority.into());
    }

    let is_permissionless = world.is_permissionless()?;

    if *is_permissionless {
        *is_permissionless = false
    }

    world.add_system(system.key())?;

    let world_size = world.size()?;
    let rent = Rent::get()?;
    let new_minimum_balance = rent.minimum_balance(world_size);

    let lamports_diff = new_minimum_balance.saturating_sub(world_acct.lamports());

    if lamports_diff > 0 {
        pinocchio_system::instructions::Transfer {
            lamports: lamports_diff,
            from: authority,
            to: world_acct,
        }
        .invoke()?;
    }

    world_acct.realloc(world_size, false)?;

    Ok(())
}
