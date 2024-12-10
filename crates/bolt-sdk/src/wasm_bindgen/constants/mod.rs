// FIXME: These can be re-exported from the ephemeral-rollups-sdk crate

use wasm_bindgen::prelude::*;

macro_rules! wasm_bindgen_const_string {
    ($name:ident = $value:expr) => {
        #[wasm_bindgen(typescript_custom_section)]
        pub const $name: &str = concat!("export const ", stringify!($name), ": string;");
    }
}

wasm_bindgen_const_string!(DELEGATION_PROGRAM_ID = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
wasm_bindgen_const_string!(MAGIC_PROGRAM_ID = "Magic11111111111111111111111111111111111111");
wasm_bindgen_const_string!(MAGIC_CONTEXT_ID = "MagicContext1111111111111111111111111111111");

