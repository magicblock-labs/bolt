use bolt_lang::*;
use position::Position;
use velocity::Velocity;

declare_id!("6LHhFVwif6N9Po3jHtSmMVtPjF6zRfL3xMosSzcrQAS8");

#[system]
pub mod system_apply_velocity {

    pub fn execute(ctx: Context<Components>, _args: Vec<u8>) -> Result<Components> {
        ctx.accounts.velocity.x = 10;
        let mut clock = Clock::get()?;
        if let Ok(clock_account_info) = ctx.sysvar_clock() {
            clock = Clock::from_account_info(clock_account_info)?;
            ctx.accounts.position.z = 300;
        }
        ctx.accounts.velocity.last_applied = clock.unix_timestamp;
        ctx.accounts.position.x += 10 * (ctx.accounts.velocity.x + 2) + 3;
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub velocity: Velocity,
        pub position: Position,
    }

    #[extra_accounts]
    pub struct ExtraAccounts {
        #[account(address = bolt_lang::solana_program::sysvar::clock::id())]
        pub sysvar_clock: AccountInfo,
        #[account(address = pubkey!("tEsT3eV6RFCWs1BZ7AXTzasHqTtMnMLCB2tjQ42TDXD"))]
        pub some_extra_account: AccountInfo,
        #[account(address = mpl_token_metadata::ID)]
        pub program_metadata: Program<mpl_token_metadata::Metadata>,
    }
}
