pub use anchor_lang::prelude::*;

pub use bolt_attribute_bolt_component::component;
pub use bolt_attribute_bolt_program::bolt_program;
pub use bolt_attribute_bolt_component_deserialize::component_deserialize;
pub use bolt_attribute_bolt_system::system;
pub use bolt_attribute_bolt_system_input::system_input;
pub use bolt_attribute_bolt_component_id::component_id;

pub use bolt_system;
pub use world;
pub use world::Entity;
pub use world::program::World;

pub use serde;
pub use serde::{Deserialize as BoltDeserialize, Serialize as BoltSerialize};

use std::str;

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

/// Metadata for the component.
#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey
}