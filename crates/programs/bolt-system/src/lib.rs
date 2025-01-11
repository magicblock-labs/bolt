use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

#[program]
pub mod bolt_system {
    use super::*;
    pub fn execute(_ctx: Context<SetData>, _args: Vec<u8>) -> Result<Vec<u8>> {
        Ok(Vec::new())
    }

    pub fn execute_2(_ctx: Context<SetData2>, _args: Vec<u8>) -> Result<(Vec<u8>, Vec<u8>)> {
        Ok((Vec::new(), Vec::new()))
    }
}

#[derive(Accounts, Clone)]
pub struct SetData<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component: UncheckedAccount<'info>,
    #[account()]
    pub authority: Signer<'info>,
}

#[derive(Accounts, Clone)]
pub struct SetData2<'info> {
    #[account()]
    pub component: UncheckedAccount<'info>,
    #[account()]
    pub component2: UncheckedAccount<'info>,
    #[account()]
    pub authority: Signer<'info>,
}
