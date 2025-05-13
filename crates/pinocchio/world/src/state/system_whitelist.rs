use super::transmutable::{Transmutable, TransmutableMut};

#[repr(C)]
#[derive(Default)]
pub struct SystemWhitelist {
    pub discriminator: u64,
}

impl SystemWhitelist {}

impl TransmutableMut for SystemWhitelist {}

impl Transmutable for SystemWhitelist {
    const LEN: usize = core::mem::size_of::<SystemWhitelist>();
}
