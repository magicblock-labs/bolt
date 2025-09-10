mod set_owner;
pub use set_owner::*;

mod set_data;
pub use set_data::*;

use proc_macro2::TokenStream;

pub struct InstructionGeneration {
    pub function: TokenStream,
    pub accounts: TokenStream,
}
