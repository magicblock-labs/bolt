use bolt_lang::*;
use component_small::Small;

declare_id!("C69UYWaXBQXUbhHQGtG8pB7DHSgh2z5Sm9ifyAnM1kkt");

#[system]
pub mod with_10_components {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        Ok(ctx.accounts)
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
