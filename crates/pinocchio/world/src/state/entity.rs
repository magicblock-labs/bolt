use super::{
    account::AnchorAccount,
    transmutable::{Transmutable, TransmutableMut},
};
use pinocchio::{
    instruction::Seed,
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};

#[repr(C)]
pub struct Entity {
    pub discriminator: [u8; 8],
    pub id: u64,
}

impl Entity {
    pub fn seeds() -> &'static [u8] {
        b"entity".as_ref()
    }

    pub fn init(&mut self, id: u64) -> Result<(), ProgramError> {
        self.discriminator = Self::DISCRIMINATOR;
        self.id = id;
        Ok(())
    } 

    pub fn remaining_seeds<'a>(
        world_entity: &'a [u8],
        extra_seed: &'a [u8], // Option<u8>: Borsh vec
    ) -> Result<(&'a [u8], &'a [u8]), ProgramError> {
        let (is_extra_seeds_bytes, seeds_vec_bytes) = extra_seed
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        let is_extra_seeds = match is_extra_seeds_bytes {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(ProgramError::InvalidInstructionData),
        }?;

        let seeds: (&[u8], &[u8]) = if is_extra_seeds {
            let (_, s) = seeds_vec_bytes.split_at(4);
            ([0; 8].as_slice(), s)
        } else {
            (world_entity, &[])
        };

        Ok(seeds)
    }

    pub fn pda(
        world_id: &[u8; 8],
        world_entity: &[u8; 8],
        extra_seed: &[u8],
    ) -> Result<(Pubkey, u8), ProgramError> {
        let seeds = Self::remaining_seeds(world_entity, extra_seed)?;

        Ok(find_program_address(
            &[Entity::seeds(), world_id, seeds.0, seeds.1],
            &crate::ID,
        ))
    }

    pub fn signer<'a>(
        world_id: &'a [u8; 8],
        world_entity: &'a [u8; 8],
        extra_seed: &'a [u8],
        bump: &'a [u8; 1],
    ) -> Result<[Seed<'a>; 5], ProgramError> {
        let seeds = Self::remaining_seeds(world_entity, extra_seed)?;

        Ok([
            Self::seeds().as_ref().into(),
            world_id.as_ref().into(),
            seeds.0.as_ref().into(),
            seeds.1.as_ref().into(),
            bump.as_ref().into(),
        ])
    }
}

impl TransmutableMut for Entity {}

impl Transmutable for Entity {
    const LEN: usize = core::mem::size_of::<Entity>();
}

impl AnchorAccount for Entity {
    const DISCRIMINATOR: [u8; 8] = [46, 157, 161, 161, 254, 46, 79, 24];

    fn discriminator(&self) -> [u8; 8] {
        self.discriminator
    }
}
