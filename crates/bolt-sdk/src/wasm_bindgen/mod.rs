use wasm_bindgen::prelude::*;

pub mod constants;

#[wasm_bindgen(module = "@solana/web3.js")]
extern "C" {
    pub type PublicKey;

    #[wasm_bindgen(constructor)]
    pub fn new(value: &str) -> PublicKey;
}

#[wasm_bindgen(module = "@coral-xyz/anchor")]
extern "C" {
    pub type Provider;
    pub type Program; 
    pub type Wallet;
    #[allow(non_camel_case_types)]
    pub type web3;
    #[allow(non_camel_case_types)]
    pub type workspace;
}


#[wasm_bindgen(js_name = "FindRegistryPda")]
pub fn find_registry_pda() -> PublicKey {
    PublicKey::new(crate::find_registry_pda().to_string().as_str())
}
