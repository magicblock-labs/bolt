use bolt_lang::*;
use component_position::Position;
use component_velocity::Velocity;

declare_id!("6LHhFVwif6N9Po3jHtSmMVtPjF6zRfL3xMosSzcrQAS8");

#[system]
#[program]
pub mod system_apply_velocity {
    use super::*;

    pub fn execute(ctx: Context<Component>, _args: Vec<u8>) -> Result<(Velocity, Position)> {
        ctx.accounts.velocity.x = 10;
        let clock = Clock::get()?;
        ctx.accounts.velocity.last_applied = clock.unix_timestamp;
        ctx.accounts.position.x += 10 * (ctx.accounts.velocity.x + 2) + 3;
        msg!("last applied: {}", ctx.accounts.velocity.last_applied);
        msg!("Position: {}", ctx.accounts.position.x);
        msg!("Remaining accounts: {}", ctx.remaining_accounts.len());
        Ok((*ctx.accounts.velocity, *ctx.accounts.position))
    }
}

#[derive(Accounts)]
pub struct Component<'info> {
    #[account()]
    pub velocity: Account<'info, Velocity>,
    #[account()]
    pub position: Account<'info, Position>,
}
