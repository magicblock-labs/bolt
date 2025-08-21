use bolt_lang::*;
use component_small::Small;

declare_id!("Hi4sMEb3uXhWCiLyrF7t3Z384an7YZsTj774cabAAPQB");

#[system]
pub mod system_with_many_components {

    pub fn execute(_ctx: Context<Components>, _args_p: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub small1: Small,
        pub small2: Small,
        pub small3: Small,
        pub small4: Small,
        pub small5: Small,
        pub small6: Small,
        pub small7: Small,
        pub small8: Small,
        pub small9: Small,
        pub small10: Small,
    }

}