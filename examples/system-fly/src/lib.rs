use bolt_lang::*;
use position::Position;

declare_id!("HT2YawJjkNmqWcLNfPAMvNsLdWwPvvvbKA5bpMw4eUpq");

#[system]
pub mod system_fly {

    pub fn execute(ctx: Context<Components>, _args: Vec<u8>) -> Result<()> {
        let pos = &mut ctx.accounts.position;
        pos.z += 1;
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub position: Position,
    }
}
