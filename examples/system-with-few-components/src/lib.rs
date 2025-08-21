use bolt_lang::*;
use component_large::Large;

declare_id!("A3kNNSgmkTNA5V1qtnrbtNeqKrYHNxUMCTkqTDaQzE97");


#[system]
pub mod system_with_few_components {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub large1: Large,
        pub large2: Large,
        pub large3: Large,
        pub large4: Large,
        pub large5: Large,
    }

}