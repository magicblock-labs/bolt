use pinocchio::program_error::ProgramError;

pub trait Transmutable: Sized {
    const LEN: usize;

    /// # Safety
    unsafe fn load_unchecked(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(&*(bytes.as_ptr() as *const Self))
    }
}

pub trait TransmutableMut: Transmutable {
    /// Return a mutable `T` reference from the given bytes.
    ///
    /// # Safety
    ///
    /// The caller must ensure that `bytes` contains a valid representation of
    /// `T`.
    #[inline(always)]
    unsafe fn load_mut_unchecked(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() != Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(&mut *(bytes.as_mut_ptr() as *mut Self))
    }
}
