use crate::state::world::{World, WorldMut};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

pub fn add_authority(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let [authority, new_authority, world_acct, _system_program] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let world_id = u64::from_le_bytes(unsafe { (data.as_ptr() as *const [u8; 8]).read() });

    // assert world pda
    if &World::pda(&world_id.to_be_bytes()).0 != world_acct.key() {
        return Err(ProgramError::InvalidSeeds);
    }

    let mut world = WorldMut::from_account_info(world_acct)?;

    let authorities = world.authorities()?;

    if authorities.is_empty()
        || (authorities.contains(authority.key()) && !authorities.contains(new_authority.key()))
    {
        let world_size = world.size()? + 32;
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

        world.add_new_authority(new_authority.key())?;
    }

    Ok(())
}
