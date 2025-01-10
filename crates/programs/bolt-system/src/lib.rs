use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;

declare_id!("7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP");

#[program]
pub mod bolt_system {
    use super::*;
    pub fn bolt_execute(_ctx: Context<SetData>, _args: Vec<u8>) -> Result<Vec<Vec<u8>>> {
        Ok(Vec::new())
    }
}

#[derive(Accounts, Clone)]
pub struct SetData<'info> {
    #[account()]
    pub authority: Signer<'info>,
    #[account()]
    pub session_token: Option<UncheckedAccount<'info>>,
}

#[cfg(feature = "cpi")]
pub trait CpiContextBuilder<'info>: ToAccountMetas + ToAccountInfos<'info> + Sized {
    fn build_cpi_context(self, program: AccountInfo<'info>) -> CpiContext<'info, 'info, 'info, 'info, Self>;
}

#[cfg(feature = "cpi")]
impl<'info> CpiContextBuilder<'info> for cpi::accounts::SetData<'info> {
    fn build_cpi_context(mut self, program: AccountInfo<'info>) -> CpiContext<'info, 'info, 'info, 'info, Self> {
        let cpi_program = program.to_account_info();
        self.session_token = Some(self.session_token.unwrap_or(program.to_account_info()));
        CpiContext::new(cpi_program, self)
    }
}