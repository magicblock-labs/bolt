use bolt_lang::*;
use component_small::Small;

declare_id!("2w9pkZoCfEciHLLDhG3zrZRprcYH7nojhyBQMnD3PtUU");

#[system]
pub mod with_4_components {

    pub fn execute(_ctx: Context<Components>, _args_p: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub small1: Small,
        pub small2: Small,
        pub small3: Small,
        pub small4: Small,
    }

}