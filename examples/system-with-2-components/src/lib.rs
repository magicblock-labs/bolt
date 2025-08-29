use bolt_lang::*;
use component_small::Small;

declare_id!("X5wTvz1i6ocNXzfrEB8JmhFCniojUZxqk3TXDq98fZX");

#[system]
pub mod with_2_components {

    pub fn execute(_ctx: Context<Components>, _args_p: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub small1: Small,
        pub small2: Small,
    }

}