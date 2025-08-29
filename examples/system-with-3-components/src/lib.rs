use bolt_lang::*;
use component_small::Small;

declare_id!("9R7rvEwCuZ6iow1Ch3sdUQKib4LBvftyBmyvSnPaAZkG");

#[system]
pub mod with_3_components {

    pub fn execute(_ctx: Context<Components>, _args_p: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub small1: Small,
        pub small2: Small,
        pub small3: Small,
    }
}
