use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

//#[system_template(max_components = 2)]
#[program]
pub mod bolt_system {
    use super::*;

    pub fn execute(_ctx: Context<SetData>, _args: Vec<u8>) -> Result<Vec<u8>> {
        Ok(Vec::new())
    }

    pub fn execute_2(_ctx: Context<SetData2>, _args: Vec<u8>) -> Result<(Vec<u8>, Vec<u8>)> {
        Ok((Vec::new(), Vec::new()))
    }

    pub fn execute_3(
        _ctx: Context<SetData3>,
        _args: Vec<u8>,
    ) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>)> {
        Ok((Vec::new(), Vec::new(), Vec::new()))
    }

    #[allow(clippy::type_complexity)]
    pub fn execute_4(
        _ctx: Context<SetData4>,
        _args: Vec<u8>,
    ) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>, Vec<u8>)> {
        Ok((Vec::new(), Vec::new(), Vec::new(), Vec::new()))
    }

    #[allow(clippy::type_complexity)]
    pub fn execute_5(
        _ctx: Context<SetData5>,
        _args: Vec<u8>,
    ) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>, Vec<u8>, Vec<u8>)> {
        Ok((Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new()))
    }
}

#[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
pub struct SetData<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component: UncheckedAccount<'info>,
}

#[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
pub struct SetData2<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component1: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component2: UncheckedAccount<'info>,
}

#[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
pub struct SetData3<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component1: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component2: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component3: UncheckedAccount<'info>,
}

#[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
pub struct SetData4<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component1: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component2: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component3: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component4: UncheckedAccount<'info>,
}

#[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
pub struct SetData5<'info> {
    #[account()]
    /// CHECK: unchecked account
    pub component1: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component2: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component3: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component4: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: unchecked account
    pub component5: UncheckedAccount<'info>,
}
