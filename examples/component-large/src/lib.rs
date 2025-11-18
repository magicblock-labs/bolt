use bolt_lang::*;

declare_id!("DEABKyknxGaCbkthh1mPSSMQnJrSLRJyZShdKpsyrjdL");

#[component]
pub struct Large {
    data: [u8; 1024],
}

impl Default for Large {
    fn default() -> Self {
        let bolt_metadata = BoltMetadata::default();
        let data = [0; 1024];
        Self { bolt_metadata, data }
    }
}