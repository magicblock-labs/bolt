use bolt_lang::*;
use component_position::Position;

declare_id!("HT2YawJjkNmqWcLNfPAMvNsLdWwPvvvbKA5bpMw4eUpq");

#[system]
#[program]
pub mod system_fly {
    use super::*;

    pub fn execute(ctx: Context<Component>, _args: Vec<u8>) -> Result<Position> {
        let pos = Position {
            x: ctx.accounts.position.x,
            y: ctx.accounts.position.y,
            z: ctx.accounts.position.z + 1,
        };
        Ok(pos)
    }
}

#[derive(Accounts)]
pub struct Component<'info> {
    #[account()]
    pub position: Account<'info, Position>,
}
