use bolt_lang::*;
use small::Small;

declare_id!("3ndvNAg4moKeLhuWQtDmcN43PuvvGsigQWRBPthfWEN3");

#[system]
pub mod with_6_components {

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
    }
}
