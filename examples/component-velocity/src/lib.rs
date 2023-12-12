use bolt_lang::*;

declare_id!("CbHEFbSQdRN4Wnoby9r16umnJ1zWbULBHg4yqzGQonU1");

#[program]
pub mod component_velocity {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn apply(ctx: Context<Apply>, args: Vec<u8>) -> Result<()> {
        let result = bolt_system::cpi::execute(ctx.accounts.set_data_ctx(), args)?;
        let res = Velocity::try_from_slice(&result.get())?;
        ctx.accounts.bolt_component.set_inner(res);
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Apply<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Velocity>,
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

    pub fn update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
        ctx.accounts
            .bolt_component
            .set_inner(Velocity::try_from_slice(&data)?);
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Velocity>,
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, payer = payer, space = Velocity::size(), seeds = [Velocity::seed(), entity.key().as_ref()], bump)]
    pub data: Account<'info, Velocity>,
    #[account()]
    /// CHECK: A generic entity account
    pub entity: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// Component data
#[account]
#[derive(InitSpace, Default, Copy)]
pub struct Velocity {
    pub x: i64,
    pub y: i64,
    pub z: i64,
    pub last_applied: i64,
}

impl Velocity {
    pub fn size() -> usize {
        8 + Velocity::INIT_SPACE
    }
    pub fn seed() -> &'static [u8] {
        b"component-velocity"
    }
}
