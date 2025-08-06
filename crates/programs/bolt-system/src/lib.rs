use anchor_lang::prelude::*;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

#[program]
pub mod bolt_system {
    use super::*;
    pub fn bolt_execute(_ctx: Context<BoltExecute>, _args: Vec<u8>) -> Result<()> {
        Ok(())
    }

    pub fn set_data(_ctx: Context<SetData>) -> Result<()> {
        Ok(())
    }

    pub fn set_owner(_ctx: Context<SetOwner>, _owner: Pubkey) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts, Clone)]
pub struct BoltExecute<'info> {
    /// CHECK: authority check
    #[account()]
    pub authority: AccountInfo<'info>,
}

#[derive(Accounts, Clone)]
pub struct SetData<'info> {
    #[account()]
    pub cpi_auth: Signer<'info>,
    /// CHECK: buffer data check
    #[account()]
    pub buffer: UncheckedAccount<'info>,
    /// CHECK: component data check
    #[account(mut)]
    pub component: UncheckedAccount<'info>,
}

#[derive(Accounts, Clone)]
pub struct SetOwner<'info> {
    #[account()]
    pub cpi_auth: Signer<'info>,
    /// CHECK: This is a component account.
    #[account(mut)]
    pub component: UncheckedAccount<'info>,
}