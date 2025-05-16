use crate::state::{
    entity::Entity,
    transmutable::{Transmutable, TransmutableMut},
    world::WorldMut,
};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};
use pinocchio_system::instructions::CreateAccount;

pub fn add_entity(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let [payer, entity_acct, world_acct, _system_program] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    let world = WorldMut::from_account_info(world_acct)?;

    let (_, bump) = Entity::pda(
        &world.metadata.id.to_be_bytes(),
        &world.metadata.entities.to_be_bytes(),
        data,
    )?;

    let lamports_needed = Rent::get()?.minimum_balance(Entity::LEN);

    CreateAccount {
        from: payer,
        to: entity_acct,
        lamports: lamports_needed,
        space: Entity::LEN as u64,
        owner: &crate::ID,
    }
    .invoke_signed(&[Entity::signer(
        &world.metadata.id.to_be_bytes(),
        &world.metadata.entities.to_be_bytes(),
        data,
        &[bump],
    )?
    .as_slice()
    .into()])?;

    let entity = unsafe { Entity::load_mut_unchecked(entity_acct.borrow_mut_data_unchecked())? };
    entity.init(world.metadata.entities)?;

    world.metadata.entities += 1;

    Ok(())
}
