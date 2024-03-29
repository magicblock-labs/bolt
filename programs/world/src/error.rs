use anchor_lang::prelude::*;

#[error_code]
pub enum WorldError {
    #[msg("Invalid authority for instruction")]
    InvalidAuthority,
    #[msg("The provided world account does not match the expected PDA.")]
    WorldAccountMismatch,
}
