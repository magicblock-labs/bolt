pub mod prelude;

pub use anchor_lang;
pub use anchor_lang::error::ErrorCode::AccountDidNotDeserialize as AccountDidNotDeserializeErrorCode;
pub use anchor_lang::prelude::*;
pub use anchor_lang::{
    AccountDeserialize, AccountSerialize, AnchorDeserialize, AnchorSerialize, Bumps, Result,
};

pub mod cpi;
pub mod instructions;

pub use session_keys;

pub use bolt_attribute_bolt_arguments::arguments;
pub use bolt_attribute_bolt_bundle::bundle;
pub use bolt_attribute_bolt_component::component;
pub use bolt_attribute_bolt_component_deserialize::component_deserialize;
pub use bolt_attribute_bolt_component_id::component_id;
pub use bolt_attribute_bolt_extra_accounts::extra_accounts;
pub use bolt_attribute_bolt_extra_accounts::pubkey;
pub use bolt_attribute_bolt_system::system;
pub use bolt_attribute_bolt_system_input::system_input;

pub use world;
pub use world::program::World;
pub use world::Entity;

pub use ephemeral_rollups_sdk::anchor::{DelegationProgram, MagicProgram};
pub use ephemeral_rollups_sdk::consts::{MAGIC_CONTEXT_ID, MAGIC_PROGRAM_ID};
pub use ephemeral_rollups_sdk::cpi::{
    delegate_account, undelegate_account, DelegateAccounts, DelegateConfig,
};
pub use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

pub use serde;

use std::str;
use std::str::FromStr;

mod errors;
pub use crate::errors::BoltError;

/// Export of the solana_program crate.
pub mod solana_program {
    pub use anchor_lang::solana_program::*;
}

/// Parses the arguments from a byte array.
pub fn parse_args<T: serde::de::DeserializeOwned>(args_p: &[u8]) -> T {
    let args_string = str::from_utf8(args_p).expect("Failed to convert to string");
    let args: T = serde_json::from_str(args_string)
        .unwrap_or_else(|_| panic!("Failed to deserialize args: {:?}", args_string));
    args
}

// Useful traits for the components

/// Trait used to add the seed and size functions to the component.
pub trait ComponentTraits {
    fn seed() -> &'static [u8];
    fn size() -> usize;
}

/// Allows to deserialize a component AccountInfo into a struct.
pub trait ComponentDeserialize: Sized {
    /// Deserializes an `AccountInfo` into a `Self`.
    /// `Account`.
    fn from_account_info(account: &anchor_lang::prelude::AccountInfo) -> Result<Self>;
}

/// Number of system input components expected by a system.
pub trait NumberOfComponents {
    const NUMBER_OF_COMPONENTS: usize;
}

/// Metadata for the component.
#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey,
}

/// Wrapper method to create a pubkey from a string
pub fn pubkey_from_str(s: &str) -> solana_program::pubkey::Pubkey {
    solana_program::pubkey::Pubkey::from_str(s).unwrap()
}

impl BoltMetadata {
    pub fn try_from_account_info(account: &AccountInfo) -> Result<Self> {
        let data = account.try_borrow_data()?;
        require!(data.len() >= 8 + BoltMetadata::INIT_SPACE, ErrorCode::AccountDidNotDeserialize);
        let slice = &data[8..8 + BoltMetadata::INIT_SPACE];
        Ok(BoltMetadata::try_from_slice(slice)?)
    }

    pub fn discriminator_from_account_info(account: &AccountInfo) -> Result<Vec<u8>> {
        let data = account.try_borrow_data()?;
        require!(data.len() >= 8, ErrorCode::AccountDidNotDeserialize);
        let discriminator = &data[0..8];
        Ok(discriminator.to_vec())
    }
}
