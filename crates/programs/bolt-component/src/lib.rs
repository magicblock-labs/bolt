use anchor_lang::prelude::*;

declare_id!("CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua");

#[program]
pub mod bolt_component {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn destroy(_ctx: Context<Destroy>) -> Result<()> {
        Ok(())
    }

    pub fn set_owner(_ctx: Context<SetOwner>, _owner: Pubkey) -> Result<()> {
        Ok(())
    }

    pub fn set_data(_ctx: Context<SetData>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account()]
    pub cpi_auth: Signer<'info>,
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Destroy<'info> {
    #[account()]
    pub cpi_auth: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(mut)]
    /// CHECK: The receiver of the component
    pub receiver: AccountInfo<'info>,
    #[account()]
    /// CHECK: The entity to destroy the component on
    pub entity: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: The component to destroy
    pub component: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: The component program data
    pub component_program_data: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetOwner<'info> {
    #[account()]
    pub cpi_auth: Signer<'info>,
    #[account(mut)]
    /// CHECK: The component to set the owner on
    pub component: UncheckedAccount<'info>,
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

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey,
}

#[cfg(feature = "cpi")]
pub trait CpiContextBuilder<'a, 'b, 'c, 'info>:
    ToAccountMetas + ToAccountInfos<'info> + Sized
{
    fn build_cpi_context(
        self,
        program: AccountInfo<'info>,
        signer_seeds: &'a [&'b [&'c [u8]]],
    ) -> CpiContext<'a, 'b, 'c, 'info, Self>;
}
