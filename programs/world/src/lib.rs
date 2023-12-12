use anchor_lang::prelude::*;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

declare_id!("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n");

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Bolt",
    project_url: "https://magicblock.gg",
    contacts: "email:dev@magicblock.gg,twitter:@magicblock",
    policy: "",
    preferred_languages: "en",
    source_code: "https://github.com/magicblock-labs/bolt"
}

#[program]
pub mod world {
    use super::*;

    pub fn initialize_registry(_ctx: Context<InitializeRegistry>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_new_world(ctx: Context<InitializeNewWorld>) -> Result<()> {
        ctx.accounts.world.id = ctx.accounts.registry.worlds;
        ctx.accounts.registry.worlds += 1;
        Ok(())
    }

    pub fn add_entity(ctx: Context<AddEntity>) -> Result<()> {
        ctx.accounts.entity.id = ctx.accounts.world.entities;
        ctx.accounts.world.entities += 1;
        msg!("entity id: {}", ctx.accounts.entity.id);
        msg!("world entities: {}", ctx.accounts.world.entities);
        Ok(())
    }

    pub fn initialize_component(ctx: Context<InitializeComponent>) -> Result<()> {
        bolt_component::cpi::initialize(ctx.accounts.build())?;
        Ok(())
    }

    pub fn apply(ctx: Context<ApplySystem>, args: Vec<u8>) -> Result<()> {
        let res = bolt_system::cpi::execute(ctx.accounts.build(), args)?;
        bolt_component::cpi::update(ctx.accounts.build_update(), res.get())?;
        Ok(())
    }

    // Apply to 2 components
    pub fn apply2(ctx: Context<ApplySystem2>, args: Vec<u8>) -> Result<()> {
        let res = bolt_system::cpi::execute_2(ctx.accounts.build(), args)?;
        let (result1, result2) = res.get();
        bolt_component::cpi::update(
            ctx.accounts.build_update(
                ctx.accounts.component_program_1.clone(),
                ctx.accounts.bolt_component_1.clone(),
            ),
            result1,
        )?;
        bolt_component::cpi::update(
            ctx.accounts.build_update(
                ctx.accounts.component_program_2.clone(),
                ctx.accounts.bolt_component_2.clone(),
            ),
            result2,
        )?;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct ApplySystem2<'info> {
        /// CHECK: bolt system program check
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: bolt component program check
        pub component_program_1: UncheckedAccount<'info>,
        #[account(mut)]
        /// CHECK: component account
        pub bolt_component_1: UncheckedAccount<'info>,
        /// CHECK: bolt component program check
        pub component_program_2: UncheckedAccount<'info>,
        #[account(mut)]
        /// CHECK: component account
        pub bolt_component_2: UncheckedAccount<'info>,
    }

    impl<'info> ApplySystem2<'info> {
        pub fn build(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData2<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData2 {
                component1: self.bolt_component_1.to_account_info(),
                component2: self.bolt_component_2.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }

        pub fn build_update(
            &self,
            component_program: UncheckedAccount<'info>,
            component: UncheckedAccount<'info>,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_component::cpi::accounts::Update<'info>> {
            let cpi_program = component_program.to_account_info();
            let cpi_accounts = bolt_component::cpi::accounts::Update {
                bolt_component: component.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }

    // Apply to 3 components
    pub fn apply3(ctx: Context<ApplySystem3>, args: Vec<u8>) -> Result<()> {
        let res = bolt_system::cpi::execute_3(ctx.accounts.build(), args)?;
        let (result1, result2, result3) = res.get();
        bolt_component::cpi::update(
            ctx.accounts.build_update(
                ctx.accounts.component_program_1.clone(),
                ctx.accounts.bolt_component_1.clone(),
            ),
            result1,
        )?;
        bolt_component::cpi::update(
            ctx.accounts.build_update(
                ctx.accounts.component_program_2.clone(),
                ctx.accounts.bolt_component_2.clone(),
            ),
            result2,
        )?;
        bolt_component::cpi::update(
            ctx.accounts.build_update(
                ctx.accounts.component_program_3.clone(),
                ctx.accounts.bolt_component_3.clone(),
            ),
            result3,
        )?;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct ApplySystem3<'info> {
        /// CHECK: bolt system program check
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: bolt component program check
        pub component_program_1: UncheckedAccount<'info>,
        #[account(mut)]
        /// CHECK: component account
        pub bolt_component_1: UncheckedAccount<'info>,
        /// CHECK: bolt component program check
        pub component_program_2: UncheckedAccount<'info>,
        #[account(mut)]
        /// CHECK: component account
        pub bolt_component_2: UncheckedAccount<'info>,
        /// CHECK: bolt component program check
        pub component_program_3: UncheckedAccount<'info>,
        #[account(mut)]
        /// CHECK: component account
        pub bolt_component_3: UncheckedAccount<'info>,
    }

    impl<'info> ApplySystem3<'info> {
        pub fn build(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData3<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData3 {
                component1: self.bolt_component_1.to_account_info(),
                component2: self.bolt_component_2.to_account_info(),
                component3: self.bolt_component_3.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }

        pub fn build_update(
            &self,
            component_program: UncheckedAccount<'info>,
            component: UncheckedAccount<'info>,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_component::cpi::accounts::Update<'info>> {
            let cpi_program = component_program.to_account_info();
            let cpi_accounts = bolt_component::cpi::accounts::Update {
                bolt_component: component.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(init_if_needed, payer = payer, space = Registry::size(), seeds = [Registry::seed()], bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeNewWorld<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, payer = payer, space = World::size(), seeds = [World::seed(), & registry.worlds.to_be_bytes()], bump)]
    pub world: Account<'info, World>,
    #[account(mut, address = Registry::pda().0)]
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddEntity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, payer = payer, space = World::size(), seeds = [Entity::seed(), &world.id.to_be_bytes(), &world.entities.to_be_bytes()], bump)]
    pub entity: Account<'info, Entity>,
    #[account(mut, address = world.pda().0)]
    pub world: Account<'info, World>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeComponent<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: component data check
    pub data: UncheckedAccount<'info>,
    #[account()]
    pub entity: Account<'info, Entity>,
    /// CHECK: component program check
    pub component_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeComponent<'info> {
    pub fn build(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, bolt_component::cpi::accounts::Initialize<'info>> {
        let cpi_program = self.component_program.to_account_info();
        let cpi_accounts = bolt_component::cpi::accounts::Initialize {
            payer: self.payer.to_account_info(),
            data: self.data.to_account_info(),
            entity: self.entity.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct ApplySystem<'info> {
    /// CHECK: bolt component program check
    pub component_program: UncheckedAccount<'info>,
    /// CHECK: bolt system program check
    pub bolt_system: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: component account
    pub bolt_component: UncheckedAccount<'info>,
}

impl<'info> ApplySystem<'info> {
    pub fn build(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData<'info>> {
        let cpi_program = self.bolt_system.to_account_info();
        let cpi_accounts = bolt_system::cpi::accounts::SetData {
            component: self.bolt_component.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn build_update(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, bolt_component::cpi::accounts::Update<'info>> {
        let cpi_program = self.component_program.to_account_info();
        let cpi_accounts = bolt_component::cpi::accounts::Update {
            bolt_component: self.bolt_component.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

// Accounts

#[account]
#[derive(InitSpace, Default, Copy)]
pub struct Registry {
    pub worlds: u64,
}

impl Registry {
    pub fn seed() -> &'static [u8] {
        b"registry"
    }

    pub fn size() -> usize {
        8 + Registry::INIT_SPACE
    }

    pub fn pda() -> (Pubkey, u8) {
        Pubkey::find_program_address(&[Registry::seed()], &crate::ID)
    }
}

#[account]
#[derive(InitSpace, Default, Copy)]
pub struct World {
    pub id: u64,
    pub entities: u64,
}

impl World {
    pub fn seed() -> &'static [u8] {
        b"world"
    }

    pub fn size() -> usize {
        8 + World::INIT_SPACE
    }

    pub fn pda(&self) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[World::seed(), &self.id.to_be_bytes()], &crate::ID)
    }
}

#[account]
#[derive(InitSpace, Default, Copy)]
pub struct Entity {
    pub id: u64,
}

impl Entity {
    pub fn seed() -> &'static [u8] {
        b"entity"
    }
}
