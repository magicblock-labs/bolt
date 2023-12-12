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
        pub bolt_component: Account<'info, ComponentData>,
        /// CHECK: The system can modify the data of the component
        pub bolt_system: UncheckedAccount<'info>,
    }

    impl<'info> Apply<'info> {
        pub fn set_data_ctx(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData {
                component: self.bolt_component.to_account_info().clone(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }

    pub fn update(_ctx: Context<Update>, _data: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, ComponentData>,
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, payer = payer, space = ComponentData::size(), seeds = [ComponentData::seed(), entity.key().as_ref()], bump)]
    pub data: Account<'info, ComponentData>,
    #[account()]
    /// CHECK: A generic entity account
    pub entity: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// Component data
#[account]
#[derive(InitSpace, Default, Copy)]
pub struct ComponentData {
    pub id: u64,
    pub position: Position,
}

impl ComponentData {
    pub fn size() -> usize {
        8 + ComponentData::INIT_SPACE
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
