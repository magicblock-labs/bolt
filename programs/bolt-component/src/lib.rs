use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::get_instruction_relative;

declare_id!("CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua");

#[program]
pub mod bolt_component {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Check if the program is called via CPI
        match get_instruction_relative(
            -1,
            &ctx.accounts.instruction_sysvar_account.to_account_info(),
        ) {
            Ok(instruction) => {
                // Verify the caller's program ID, if necessary
                if instruction.program_id != ctx.accounts.authority.key() {
                    return Err(ErrorCode::UnauthorizedCaller.into());
                }
            }
            Err(_) => {
                return Err(ErrorCode::MustBeCalledViaCpi.into());
            }
        }

        ctx.accounts.data.bolt_metadata.authority = *ctx.accounts.authority.key;
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
        pub bolt_system: UncheckedAccount<'info>,
        pub authority: Signer<'info>,
    }

    impl<'info> Apply<'info> {
        pub fn set_data_ctx(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData {
                component: self.bolt_component.to_account_info().clone(),
                authority: self.authority.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }

    pub fn update(ctx: Context<Update>, _data: Vec<u8>) -> Result<()> {
        // Same CPI check as in initialize
        match get_instruction_relative(
            -1,
            &ctx.accounts.instruction_sysvar_account.to_account_info(),
        ) {
            Ok(instruction) => {
                if instruction.program_id != ctx.accounts.authority.key() {
                    return Err(ErrorCode::UnauthorizedCaller.into());
                }
            }
            Err(_) => {
                return Err(ErrorCode::MustBeCalledViaCpi.into());
            }
        }
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Component>,
        #[account()]
        /// CHECK: The authority of the component
        pub authority: AccountInfo<'info>,
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        /// CHECK: The instruction sysvar
        pub instruction_sysvar_account: AccountInfo<'info>,
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

#[error_code]
pub enum ErrorCode {
    #[msg("The instruction must be called from a CPI")]
    MustBeCalledViaCpi,
    #[msg("Unauthorized caller program")]
    UnauthorizedCaller,
}
