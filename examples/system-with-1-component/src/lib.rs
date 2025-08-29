use bolt_lang::*;
use component_small::Small;

declare_id!("BsVKJF2H9GN1P9WrexdgEY4ztiweKvfQo6ydLWUEw6n7");

#[system]
pub mod with_1_component {

    pub fn execute(_ctx: Context<Components>, _args_p: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub small1: Small,
    }
}
