use bolt_lang::*;

declare_id!("FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX");

#[component]
pub struct Large {
    pub value: [u8; 32],
}

impl Default for Large {
    fn default() -> Self {
        Self {
            bolt_metadata: BoltMetadata::default(),
            value: [0; 32],
        }
    }
}
