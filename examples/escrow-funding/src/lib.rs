use bolt_lang::anchor_lang::*;
use bolt_lang::*;
use component_small::Small;

declare_id!("4Um2d8SvyfWyLLtfu2iJMFhM77DdjjyQusEy7K3VhPkd");

#[system]
pub mod escrow_funding {
    pub fn execute<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Components<'info>>, args: Args) -> Result<Components<'info>> {
        let receiver = ctx.accounts.receiver.to_account_info();
        let sender = ctx.sender()?.clone();
        let system_program = ctx.system_program()?.clone();

        let cpi_accounts = system_program::Transfer {
            from: sender,
            to: receiver,
        };
        let cpi_ctx = CpiContext::new(system_program, cpi_accounts);
        system_program::transfer(cpi_ctx, args.amount)?;

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub receiver: Small,
    }

    #[arguments]
    pub struct Args {
        amount: u64
    }

    #[extra_accounts]
    pub struct ExtraAccounts {
        #[account(mut)]
        pub sender: AccountInfo,
        #[account(address = bolt_lang::solana_program::system_program::id())]
        pub system_program: AccountInfo,
    }
}
