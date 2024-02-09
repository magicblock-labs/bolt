use bolt_lang::*;
use component_position::Position;

declare_id!("HT2YawJjkNmqWcLNfPAMvNsLdWwPvvvbKA5bpMw4eUpq");

#[system]
pub mod system_fly {
    pub fn execute(ctx: Context<Component>, _args: Vec<u8>) -> Result<Position> {
        let pos = &mut ctx.accounts.position;
        pos.z += 1;
        Ok(pos)
    }
}

#[system_input]
pub struct Component {
    pub position: Position,
}