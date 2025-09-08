use anchor_lang::prelude::*;

#[error_code]
pub enum WorldError {
    #[msg("Invalid authority for instruction")]
    InvalidAuthority,
    #[msg("Invalid system output")]
    InvalidSystemOutput,
    #[msg("The provided world account does not match the expected PDA.")]
    WorldAccountMismatch,
    #[msg("Exceed the maximum number of authorities.")]
    TooManyAuthorities,
    #[msg("The provided authority not found")]
    AuthorityNotFound,
    #[msg("The system is not approved in this world instance")]
    SystemNotApproved,
    #[msg("The component owner does not match the program")]
    InvalidComponentOwner,
    #[msg("Invalid buffer account")]
    InvalidBufferAccount
}
