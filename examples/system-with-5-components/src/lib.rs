use bolt_lang::*;
use component_small::Small;

declare_id!("8KsdHMGdS4mQjpKFhc2PWBw2tyxwNbEKCnZLKp3riC5o");

#[system]
pub mod with_5_components {

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
    }

}