use anchor_lang::prelude::*;

#[error_code]
pub enum BoltError {
    /// Returned if the wrong authority attempts to sign for an instruction
    #[msg("Invalid authority for instruction")]
    InvalidAuthority,
    /// Returned if the wrong authority attempts to sign for an instruction
    #[msg("Invalid caller: must be called from a CPI instruction")]
    InvalidCaller,
}
