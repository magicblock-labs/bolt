use bolt_lang::*;
use small::Small;

declare_id!("EbTAEnrVV4f8W7Fd4TxW3jLjfpyhr74wQf7rSHRQ8u78");

#[system]
pub mod with_8_components {

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
    }
}
