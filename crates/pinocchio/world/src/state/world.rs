use super::{
    account::AnchorAccount,
    transmutable::{Transmutable, TransmutableMut},
};
use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    memory::sol_memmove,
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};

pub struct World;

impl World {
    pub const DISCRIMINATOR: [u8; 8] = [145, 45, 170, 174, 122, 32, 155, 124];

    pub const INIT_SIZE: usize = 8 + 8 + 8 + 4 + 1 + 4;

    fn world_seed() -> &'static [u8] {
        b"world"
    }

    pub fn pda(id: &[u8; 8]) -> (Pubkey, u8) {
        find_program_address(&[Self::world_seed(), id], &crate::ID)
    }

    pub fn signer<'a>(world_id: &'a [u8; 8], bump: &'a [u8; 1]) -> [Seed<'a>; 3] {
        [
            Self::world_seed().as_ref().into(),
            world_id.as_ref().into(),
            bump.as_ref().into(),
        ]
    }
}

#[repr(C)]
#[derive(Debug)]
pub struct WorldMetadata {
    pub discriminator: [u8; 8],
    pub id: u64,
    pub entities: u64,
}

impl TransmutableMut for WorldMetadata {}

impl Transmutable for WorldMetadata {
    const LEN: usize = core::mem::size_of::<WorldMetadata>();
}

impl WorldMetadata {
    pub fn new(id: u64) -> Self {
        Self {
            id,
            ..Default::default()
        }
    }
}

impl Default for WorldMetadata {
    fn default() -> Self {
        Self {
            discriminator: World::DISCRIMINATOR,
            entities: 0,
            id: 0,
        }
    }
}

#[allow(dead_code)]
pub struct WorldRef<'a> {
    pub metadata: &'a WorldMetadata,
    pub authorities_len: u32,
    pub authorities: &'a [Pubkey],
    pub permissionless: &'a u8,
    pub systems_len: u32,
    pub systems: &'a [Pubkey],
}

impl<'a> WorldRef<'a> {
    pub fn from_account_info(account_info: &'a AccountInfo) -> Result<Self, ProgramError> {
        let data = Self::from_bytes(unsafe { account_info.borrow_data_unchecked() })?;
        data.assert_account(account_info)?;
        Ok(data)
    }

    pub fn from_bytes(bytes: &'a [u8]) -> Result<Self, ProgramError> {
        let world = unsafe {
            let metadata = WorldMetadata::load_unchecked(&bytes[..WorldMetadata::LEN])?;

            let authorities_len_ptr =
                bytes.as_ptr().add(WorldMetadata::LEN) as *const _ as *const u32;

            //  aligned up to this point, shouldn't error
            let authorities_len = authorities_len_ptr.read();
            let authorities_ptr = authorities_len_ptr.add(1) as *const Pubkey;

            let permissionless_ptr = authorities_ptr.add(authorities_len as usize) as *const u8;

            let systems_len_ptr = permissionless_ptr.add(1) as *const [u8; 4];
            let systems_len = u32::from_le_bytes(systems_len_ptr.read());

            let systems_ptr = systems_len_ptr.add(1) as *const Pubkey;

            Self {
                metadata,
                authorities: core::slice::from_raw_parts(authorities_ptr, authorities_len as usize),
                authorities_len,
                permissionless: &*permissionless_ptr,
                systems_len,
                systems: core::slice::from_raw_parts(
                    systems_ptr,
                    systems_len as usize / core::mem::size_of::<Pubkey>(),
                ),
            }
        };

        Ok(world)
    }

    pub fn permissionless(&self) -> Result<bool, ProgramError> {
        match self.permissionless {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(ProgramError::InvalidAccountData),
        }
    }
}

pub struct WorldMut<'a> {
    pub metadata: &'a mut WorldMetadata,
    pub data: &'a mut [u8],
}

impl<'a> WorldMut<'a> {
    pub fn from_account_info(account_info: &'a AccountInfo) -> Result<Self, ProgramError> {
        let data = Self::from_bytes(unsafe { account_info.borrow_mut_data_unchecked() })?;
        data.assert_account(account_info)?;
        Ok(data)
    }

    pub fn from_bytes(bytes: &'a mut [u8]) -> Result<Self, ProgramError> {
        let world = unsafe {
            let (metadata_bytes, data) = bytes.split_at_mut(WorldMetadata::LEN);
            let metadata = WorldMetadata::load_mut_unchecked(metadata_bytes)?;
            Self { metadata, data }
        };

        Ok(world)
    }

    pub fn init(&mut self, id: u64) -> Result<(), ProgramError> {
        *self.metadata = WorldMetadata::new(id);
        *self.is_permissionless()? = true;
        Ok(())
    }

    pub fn add_new_authority(&mut self, authority: &Pubkey) -> Result<(), ProgramError> {
        let data_ptr = self.data as *mut _ as *mut u8;
        let offset = self.authority_size()?;

        unsafe {
            let new_authority_ptr = data_ptr.add(offset) as *mut Pubkey;
            let permissionles_ptr = new_authority_ptr.add(1) as *mut u8;
            let size = self.permissionless_len()? + self.systems_size()?;
            sol_memmove(permissionles_ptr, new_authority_ptr as *mut u8, size);
            *new_authority_ptr = *authority;
        };

        *self.authorities_len()? += 1;

        Ok(())
    }

    pub fn remove_authority(&mut self, index: usize) -> Result<(), ProgramError> {
        self.data
            .copy_within(authorities_size(index + 1).., authorities_size(index));

        *self.authorities_len()? -= 1;

        Ok(())
    }

    pub fn authorities_len(&mut self) -> Result<&mut u32, ProgramError> {
        Ok(unsafe { &mut *(self.data.as_mut_ptr() as *mut u32) })
    }

    pub fn permissionless_len(&mut self) -> Result<usize, ProgramError> {
        Ok(core::mem::size_of::<bool>())
    }

    pub fn permissionless(&mut self) -> Result<&mut u8, ProgramError> {
        let byte = &mut self.data[self.authority_size()?];
        Ok(byte)
    }

    pub fn is_permissionless(&mut self) -> Result<&mut bool, ProgramError> {
        let byte = self.permissionless()?;
        match byte {
            0 | 1 => {
                let ptr = byte as *mut u8 as *mut bool;
                Ok(unsafe { &mut *ptr })
            }
            _ => Err(ProgramError::InvalidAccountData),
        }
    }

    pub fn authority_size(&mut self) -> Result<usize, ProgramError> {
        let authorities_len = *self.authorities_len()?;
        Ok(authorities_size(authorities_len as usize))
    }

    pub fn authorities(&mut self) -> Result<&[Pubkey], ProgramError> {
        let authorities_len = *self.authorities_len()?;
        let authorities = unsafe {
            let authorities_ptr =
                self.data
                    .as_mut_ptr()
                    .add(core::mem::size_of::<u32>()) as *mut _ as *const Pubkey;
            core::slice::from_raw_parts(authorities_ptr, authorities_len as usize)
        };
        Ok(authorities)
    }

    pub fn systems_size(&mut self) -> Result<usize, ProgramError> {
        let systems_len = *self.systems_len()?;
        Ok(systems_size(systems_len as usize))
    }

    pub fn systems_len(&mut self) -> Result<&mut u32, ProgramError> {
        Ok(unsafe {
            let permissionless_ptr = self.permissionless()? as *mut u8;
            &mut *(permissionless_ptr.add(1) as *mut u32)
        })
    }

    pub fn systems_pubkey_slice(&mut self) -> Result<&mut [Pubkey], ProgramError> {
        let systems_len = self.systems_len()?;

        let systems_ptr = unsafe { (systems_len as *mut _ as *mut u8).add(4) as *mut Pubkey };

        Ok(unsafe {
            core::slice::from_raw_parts_mut(
                systems_ptr,
                *systems_len as usize / core::mem::size_of::<Pubkey>(),
            )
        })
    }

    pub fn add_system(&mut self, system: &Pubkey) -> Result<usize, ProgramError> {
        let system_slice = self.systems_pubkey_slice()?;

        let insert_pos = match system_slice.binary_search(system) {
            Ok(_) => return Ok(0),
            Err(pos) => pos,
        };

        let shift = system_slice.len().saturating_sub(insert_pos);

        let size = core::mem::size_of::<Pubkey>();

        unsafe {
            let src = system_slice.as_mut_ptr().add(insert_pos);

            if shift > 0 {
                let dst = src.add(1);
                sol_memmove(dst as *mut u8, src as *mut u8, shift * size);
            };

            *src = *system;
        }

        *self.systems_len()? += size as u32;

        Ok(size)
    }

    pub fn remove_system(&mut self, system: &Pubkey) -> Result<usize, ProgramError> {
        match self.systems_pubkey_slice()?.binary_search(system) {
            Ok(index) => self.remove_system_at_index(index),
            Err(_) => Ok(0),
        }
    }

    fn remove_system_at_index(&mut self, index: usize) -> Result<usize, ProgramError> {
        let authorities_len = self.systems_pubkey_slice()?.len();

        let remaining_systems = authorities_len - index - 1;

        let size = core::mem::size_of::<Pubkey>();

        let size_to_move = remaining_systems * size;

        if remaining_systems > 0 {
            unsafe {
                let authorities_ptr = self.systems_pubkey_slice()?.as_mut_ptr();
                let src_ptr = authorities_ptr.add(index + 1);
                let dst_ptr = authorities_ptr.add(index);
                sol_memmove(dst_ptr as *mut u8, src_ptr as *mut u8, size_to_move);
            };
        }

        *self.systems_len()? -= size as u32;

        Ok(size)
    }

    pub fn size(&mut self) -> Result<usize, ProgramError> {
        Ok(WorldMetadata::LEN
            + self.authority_size()?
            + self.permissionless_len()?
            + self.systems_size()?)
    }
}

pub fn systems_size(count: usize) -> usize {
    core::mem::size_of::<u32>() + count
}

pub fn authorities_size(count: usize) -> usize {
    core::mem::size_of::<u32>() + (count * core::mem::size_of::<Pubkey>())
}

impl AnchorAccount for WorldRef<'_> {
    const DISCRIMINATOR: [u8; 8] = World::DISCRIMINATOR;

    fn discriminator(&self) -> [u8; 8] {
        self.metadata.discriminator
    }
}

impl AnchorAccount for WorldMut<'_> {
    const DISCRIMINATOR: [u8; 8] = World::DISCRIMINATOR;

    fn discriminator(&self) -> [u8; 8] {
        self.metadata.discriminator
    }
}
