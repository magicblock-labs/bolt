use crate::{
    error::WorldError,
    state::world::{World, WorldMut},
};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

pub fn remove_authority(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let [authority, authority_to_delete, world_acct, _system_program] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let world_id = unsafe { (data.as_ptr() as *const u64).read_unaligned() };

    // assert world pda
    if &World::pda(&world_id.to_be_bytes()).0 != world_acct.key() {
        return Err(ProgramError::InvalidSeeds);
    }

    let mut world = WorldMut::from_bytes(unsafe { world_acct.borrow_mut_data_unchecked() })?;

    let authorities = world.authorities()?;

    if !authorities.contains(authority_to_delete.key()) {
        return Err(WorldError::InvalidAuthority.into());
    }

    if let Some(index) = world
        .authorities()?
        .iter()
        .position(|x| x == authority_to_delete.key())
    {
        world.remove_authority(index)?;
        let world_size = world.size()?;
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(world_size);

        let lamports_diff = world_acct.lamports().saturating_sub(new_minimum_balance);

        if lamports_diff > 0 {
            unsafe {
                *world_acct.borrow_mut_lamports_unchecked() -= lamports_diff;
                *authority.borrow_mut_lamports_unchecked() += lamports_diff
            }
        }

        world_acct.realloc(world_size, false)?;

        Ok(())
    } else {
        Err(WorldError::AuthorityNotFound.into())
    }
}
