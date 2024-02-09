use anchor_lang::prelude::*;

#[error_code]
pub enum WorldError {
    /// Returned if the wrong authority attempts to sign for an instruction
    #[msg("Invalid authority for instruction")]
    InvalidAuthority,
}