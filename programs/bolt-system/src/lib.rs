use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;
use bolt_helpers_system_template::system_template;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

#[system_template(max_components = 5)]
#[program]
pub mod bolt_system {
    use super::*;
    pub fn execute(_ctx: Context<SetData>, _args: Vec<u8>) -> Result<Vec<u8>> {
        Ok(Vec::new())
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
