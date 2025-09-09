use bolt_lang::*;
use component_small::Small;

declare_id!("4ESiD77Gjjfuywhw8NBnryHezXtwDSA27ustL29JdX7i");

#[system]
pub mod with_7_components {

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
    }
}
