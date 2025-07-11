use pinocchio::{instruction::Seed, program_error::ProgramError, pubkey::{find_program_address, Pubkey}};

use super::{
    account::AnchorAccount,
    transmutable::{Transmutable, TransmutableMut},
};

#[repr(C)]
pub struct Registry {
    pub discriminator: [u8; 8],
    pub worlds: u64,
}

impl Registry {
    pub fn seeds() -> &'static [u8] {
        b"registry".as_ref()
    }

    pub fn pda() -> (Pubkey, u8) {
        find_program_address(&[Registry::seeds()], &crate::ID)
    }

    pub fn signer(bump: &[u8; 1]) -> [Seed; 2] {
        [Registry::seeds().as_ref().into(), bump.as_ref().into()]
    }

    pub fn init(&mut self) -> Result<(), ProgramError> {
        *self = Registry::default(); 
        Ok(())
    }
}

impl Default for Registry {
    fn default() -> Self {
        Self {
            discriminator: Self::DISCRIMINATOR,
            worlds: 0
        }
    }
}

impl TransmutableMut for Registry {}

impl Transmutable for Registry {
    const LEN: usize = core::mem::size_of::<Registry>();
}

impl AnchorAccount for Registry {
    const DISCRIMINATOR: [u8; 8] = [47, 174, 110, 246, 184, 182, 252, 218];

    fn discriminator(&self) -> [u8; 8] {
        self.discriminator
    }
}
