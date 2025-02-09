use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

#[program]
pub mod bolt_system {
    use super::*;
    pub fn bolt_execute(_ctx: Context<BoltExecute>, _args: Vec<u8>) -> Result<Vec<Vec<u8>>> {
        Ok(Vec::new())
    }
}

#[derive(Accounts, Clone)]
pub struct BoltExecute<'info> {
    /// CHECK: authority check
    #[account()]
    pub authority: AccountInfo<'info>,
}
