use anchor_lang::prelude::*;

declare_id!("CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua");

#[program]
pub mod bolt_component {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn apply(_ctx: Context<Apply>, _args: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Apply<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Component>,
        /// CHECK: The system can modify the data of the component
        #[account()]
        pub bolt_system: UncheckedAccount<'info>,
        #[account()]
        pub authority: Signer<'info>,
    }

    pub fn update(_ctx: Context<Update>, _data: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Component>,
        #[account()]
        /// CHECK: The authority of the component
        pub authority: Signer<'info>,
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        /// CHECK: The instruction sysvar
        pub instruction_sysvar_account: AccountInfo<'info>,
        #[account()]
        pub session_token: Option<UncheckedAccount<'info>>,
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, payer = payer, space = Component::size(), seeds = [Component::seed(), entity.key().as_ref()], bump)]
    pub data: Account<'info, Component>,
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

// Component data
#[account]
#[derive(InitSpace, Default, Copy)]
pub struct Component {
    pub position: Position,
    pub bolt_metadata: BoltMetadata,
}

impl Component {
    pub fn size() -> usize {
        8 + Component::INIT_SPACE
    }
    pub fn seed() -> &'static [u8] {
        b"origin-component"
    }
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct Position {
    pub x: i64,
    pub y: i64,
    pub z: i64,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey,
}

#[cfg(feature = "cpi")]
pub trait CpiContextBuilder<'info>: ToAccountMetas + ToAccountInfos<'info> + Sized {
    fn build_cpi_context(self, program: AccountInfo<'info>) -> CpiContext<'info, 'info, 'info, 'info, Self>;
}

#[cfg(feature = "cpi")]
impl<'info> CpiContextBuilder<'info> for cpi::accounts::Update<'info> {
    fn build_cpi_context(mut self, program: AccountInfo<'info>) -> CpiContext<'info, 'info, 'info, 'info, Self> {
        let cpi_program = program.to_account_info();
        self.session_token = Some(self.session_token.unwrap_or(program.to_account_info()));
        CpiContext::new(cpi_program, self)
    }
}
