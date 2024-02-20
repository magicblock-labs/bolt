use bolt_lang::*;
use position::Position;

declare_id!("HT2YawJjkNmqWcLNfPAMvNsLdWwPvvvbKA5bpMw4eUpq");

#[system]
pub mod system_fly {

    pub fn execute(ctx: Context<Components>, _args: Vec<u8>) -> Result<Components> {
        let pos = &mut ctx.accounts.position;
        pos.z += 1;
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub position: Position,
    }
}
