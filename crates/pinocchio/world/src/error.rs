use pinocchio::program_error::ProgramError;

pub enum WorldError {
    InvalidAuthority = 6000,
    InvalidSystemOutput,
    WorldAccountMismatch,
    TooManyAuthorities,
    AuthorityNotFound,
    SystemNotApproved,
}

impl From<WorldError> for ProgramError {
    fn from(e: WorldError) -> Self {
        ProgramError::Custom(e as u32)
    }
}