use bolt_lang::*;
use large::Large;

declare_id!("4X7t7eCjd2pvNThY9DQ3rKQKNLeeHhgEv74JGwh7jJEz");

#[system]
pub mod with_large_component {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub large: Large,
    }

}