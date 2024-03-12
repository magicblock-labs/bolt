use bolt_lang::*;
use position::Position;
use velocity::Velocity;

declare_id!("6LHhFVwif6N9Po3jHtSmMVtPjF6zRfL3xMosSzcrQAS8");

#[system]
pub mod system_apply_velocity {

    pub fn execute(ctx: Context<Components>, _args: Vec<u8>) -> Result<Components> {
        ctx.accounts.velocity.x = 10;
        let mut clock = Clock::get()?;
        if !ctx.remaining_accounts.is_empty() {
            clock = Clock::from_account_info(&ctx.remaining_accounts[0])?;
            ctx.accounts.position.z = 300;
        }
        ctx.accounts.velocity.last_applied = clock.unix_timestamp;
        ctx.accounts.position.x += 10 * (ctx.accounts.velocity.x + 2) + 3;
        msg!("last applied: {}", ctx.accounts.velocity.last_applied);
        msg!("Position: {}", ctx.accounts.position.x);
        msg!("Remaining accounts: {}", ctx.remaining_accounts.len());
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub velocity: Velocity,
        pub position: Position,
    }
}
