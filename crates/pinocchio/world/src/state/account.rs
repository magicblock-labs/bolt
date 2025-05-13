use pinocchio::{account_info::AccountInfo, ProgramResult};

use crate::utils::assert_program_account_and_discriminator;

pub trait AnchorAccount {
    const DISCRIMINATOR: [u8; 8];

    fn discriminator(&self) -> [u8; 8];

    fn assert_account(&self, account_info: &AccountInfo) -> ProgramResult {
        assert_program_account_and_discriminator(account_info, &self.discriminator())
    }
}
