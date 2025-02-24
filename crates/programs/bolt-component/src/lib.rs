use anchor_lang::prelude::*;

declare_id!("CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua");

#[program]
pub mod bolt_component {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn update(_ctx: Context<Update>, _data: Vec<u8>) -> Result<()> {
        Ok(())
    }

    pub fn update_with_session(_ctx: Context<UpdateWithSession>, _data: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        /// CHECK: The component to update
        pub bolt_component: UncheckedAccount<'info>,
        #[account()]
        /// CHECK: The authority of the component
        pub authority: Signer<'info>,
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        /// CHECK: The instruction sysvar
        pub instruction_sysvar_account: AccountInfo<'info>,
    }

    #[derive(Accounts)]
    pub struct UpdateWithSession<'info> {
        #[account(mut)]
        /// CHECK: The component to update
        pub bolt_component: UncheckedAccount<'info>,
        #[account()]
        /// CHECK: The authority of the component
        pub authority: Signer<'info>,
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        /// CHECK: The instruction sysvar
        pub instruction_sysvar_account: AccountInfo<'info>,
        #[account()]
        /// CHECK: The session token
        pub session_token: UncheckedAccount<'info>,
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: The component to initialize
    pub data: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: A generic entity account
    pub entity: AccountInfo<'info>,
    #[account()]
    /// CHECK: The authority of the component
    pub authority: AccountInfo<'info>,
    #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
    /// CHECK: The instruction sysvar
    pub instruction_sysvar_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey,
}

#[cfg(feature = "cpi")]
pub trait CpiContextBuilder<'info>: ToAccountMetas + ToAccountInfos<'info> + Sized {
    fn build_cpi_context(
        self,
        program: AccountInfo<'info>,
    ) -> CpiContext<'info, 'info, 'info, 'info, Self>;
}

#[cfg(feature = "cpi")]
impl<'info> CpiContextBuilder<'info> for cpi::accounts::Update<'info> {
    fn build_cpi_context(
        self,
        program: AccountInfo<'info>,
    ) -> CpiContext<'info, 'info, 'info, 'info, Self> {
        let cpi_program = program.to_account_info();
        CpiContext::new(cpi_program, self)
    }
}

#[cfg(feature = "cpi")]
impl<'info> CpiContextBuilder<'info> for cpi::accounts::UpdateWithSession<'info> {
    fn build_cpi_context(
        self,
        program: AccountInfo<'info>,
    ) -> CpiContext<'info, 'info, 'info, 'info, Self> {
        let cpi_program = program.to_account_info();
        CpiContext::new(cpi_program, self)
    }
}
