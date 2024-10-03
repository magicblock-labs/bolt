use anchor_lang::prelude::*;
use bolt_helpers_world_apply::apply_system;
use std::collections::BTreeSet;
use tuple_conv::RepeatedTuple;

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

mod error;

#[apply_system(max_components = 5)]
#[program]
pub mod world {
    use super::*;
    use crate::error::WorldError;

    pub fn initialize_registry(_ctx: Context<InitializeRegistry>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_new_world(ctx: Context<InitializeNewWorld>) -> Result<()> {
        ctx.accounts.world.id = ctx.accounts.registry.worlds;
        ctx.accounts.registry.worlds += 1;
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn add_authority(ctx: Context<AddAuthority>, world_id: u64) -> Result<()> {
        if ctx.accounts.world.authorities.len() == 3 {
            return Err(WorldError::TooManyAuthorities.into());
        }
        if ctx.accounts.world.authorities.is_empty()
            || ctx
                .accounts
                .world
                .authorities
                .contains(ctx.accounts.authority.key)
        {
            ctx.accounts
                .world
                .authorities
                .push(*ctx.accounts.new_authority.key);

            let new_space = World::space_for_authorities(
                ctx.accounts.world.authorities.len(),
                ctx.accounts.world.systems.len(),
            );

            // Transfer to make it rent exempt
            let rent = Rent::get()?;
            let new_minimum_balance = rent.minimum_balance(new_space);
            let lamports_diff = new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
            if lamports_diff > 0 {
                anchor_lang::solana_program::program::invoke(
                    &anchor_lang::solana_program::system_instruction::transfer(
                        ctx.accounts.authority.key,
                        ctx.accounts.world.to_account_info().key,
                        lamports_diff
                    ),
                    &[
                        ctx.accounts.authority.to_account_info(),
                        ctx.accounts.world.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                )?;
            }
            ctx.accounts.world.to_account_info().realloc(new_space, false)?;
        }
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn remove_authority(ctx: Context<RemoveAuthority>, world_id: u64) -> Result<()> {
        if !ctx
            .accounts
            .world
            .authorities
            .contains(ctx.accounts.authority.key)
        {
            return Err(WorldError::InvalidAuthority.into());
        }
        if let Some(index) = ctx
            .accounts
            .world
            .authorities
            .iter()
            .position(|&x| x == *ctx.accounts.authority_to_delete.key)
        {
            ctx.accounts.world.authorities.remove(index);

            let new_space = World::space_for_authorities(
                ctx.accounts.world.authorities.len(),
                ctx.accounts.world.systems.len(),
            );

            // Remove the extra rent
            let rent = Rent::get()?;
            let new_minimum_balance = rent.minimum_balance(new_space);
            let lamports_diff = new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
            **ctx.accounts.world.to_account_info().try_borrow_mut_lamports()? += lamports_diff;
            **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? -= lamports_diff;
            ctx.accounts.world.to_account_info().realloc(new_space, false)?;
            Ok(())
        } else {
            Err(WorldError::AuthorityNotFound.into())
        }
    }

    pub fn approve_system(ctx: Context<ApproveSystem>) -> Result<()> {
        if !ctx.accounts.authority.is_signer {
            return Err(WorldError::InvalidAuthority.into());
        }
        if !ctx
            .accounts
            .world
            .authorities
            .contains(ctx.accounts.authority.key)
        {
            return Err(WorldError::InvalidAuthority.into());
        }
        if ctx.accounts.world.permissionless {
            ctx.accounts.world.permissionless = false;
        }

        let mut world_systems = WorldSystems::try_from_slice(ctx.accounts.world.systems.as_ref()).unwrap_or_default();
        world_systems.approved_systems.insert(ctx.accounts.system.key());

        let encoded_world_systems = world_systems.try_to_vec()?;
        ctx.accounts.world.systems = encoded_world_systems.clone();

        let new_space = World::space_for_authorities(
            ctx.accounts.world.authorities.len(),
            encoded_world_systems.len(),
        );

        // Transfer to make it rent exempt
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_space);
        let lamports_diff = new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
        if lamports_diff > 0 {
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(
                    ctx.accounts.authority.key,
                    ctx.accounts.world.to_account_info().key,
                    lamports_diff
                ),
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.world.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
        ctx.accounts.world.to_account_info().realloc(new_space, false)?;
        msg!("Approved system: {:?}", world_systems);
        Ok(())
    }


    pub fn remove_system(ctx: Context<RemoveSystem>) -> Result<()> {
        if !ctx.accounts.authority.is_signer {
            return Err(WorldError::InvalidAuthority.into());
        }
        if !ctx
            .accounts
            .world
            .authorities
            .contains(ctx.accounts.authority.key)
        {
            return Err(WorldError::InvalidAuthority.into());
        }

        let mut world_systems = WorldSystems::try_from_slice(ctx.accounts.world.systems.as_ref()).unwrap_or_default();
        world_systems.approved_systems.remove(&ctx.accounts.system.key());

        let encoded_world_systems = world_systems.try_to_vec()?;
        ctx.accounts.world.systems = encoded_world_systems.clone();

        let new_space = World::space_for_authorities(
            ctx.accounts.world.authorities.len(),
            encoded_world_systems.len(),
        );

        // Remove the extra rent
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_space);
        let lamports_diff = new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
        **ctx.accounts.world.to_account_info().try_borrow_mut_lamports()? += lamports_diff;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? -= lamports_diff;
        ctx.accounts.world.to_account_info().realloc(new_space, false)?;
        msg!("Approved system: {:?}", world_systems);
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn add_entity(ctx: Context<AddEntity>, extra_seed: Option<String>) -> Result<()> {
        require!(
            ctx.accounts.world.key() == ctx.accounts.world.pda().0,
            WorldError::WorldAccountMismatch
        );
        ctx.accounts.entity.id = ctx.accounts.world.entities;
        ctx.accounts.world.entities += 1;
        Ok(())
    }

    pub fn initialize_component(ctx: Context<InitializeComponent>) -> Result<()> {
        if !ctx.accounts.authority.is_signer && ctx.accounts.authority.key != &ID {
            return Err(WorldError::InvalidAuthority.into());
        }
        bolt_component::cpi::initialize(ctx.accounts.build())?;
        Ok(())
    }

    pub fn apply<'info>(
        ctx: Context<'_, '_, '_, 'info, ApplySystem<'info>>,
        args: Vec<u8>,
    ) -> Result<()> {
        if !ctx.accounts.authority.is_signer && ctx.accounts.authority.key != &ID {
            return Err(WorldError::InvalidAuthority.into());
        }
        let remaining_accounts: Vec<AccountInfo<'info>> = ctx.remaining_accounts.to_vec();
        let res = bolt_system::cpi::execute(
            ctx.accounts
                .build()
                .with_remaining_accounts(remaining_accounts),
            args,
        )?;

        bolt_component::cpi::update(
            build_update_context(
                ctx.accounts.component_program.clone(),
                ctx.accounts.bolt_component.clone(),
                ctx.accounts.authority.clone(),
                ctx.accounts.instruction_sysvar_account.clone(),
            ),
            res.get(),
        )?;
        Ok(())
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
        /// CHECK: authority check
        pub authority: Signer<'info>,
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        /// CHECK: instruction sysvar check
        pub instruction_sysvar_account: UncheckedAccount<'info>,
        #[account()]
        pub world: Account<'info, World>,
    }

    impl<'info> ApplySystem<'info> {
        pub fn build(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData {
                component: self.bolt_component.to_account_info(),
                authority: self.authority.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(init, payer = payer, space = Registry::size(), seeds = [Registry::seed()], bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeNewWorld<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = World::size(), seeds = [World::seed(), &registry.worlds.to_be_bytes()], bump)]
    pub world: Account<'info, World>,
    #[account(mut, address = Registry::pda().0)]
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(world_id: u64)]
pub struct AddAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account()]
    /// CHECK: new authority check
    pub new_authority: AccountInfo<'info>,
    #[account(mut, seeds = [World::seed(), &world_id.to_be_bytes()], bump)]
    pub world: Account<'info, World>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(world_id: u64)]
pub struct RemoveAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account()]
    /// CHECK: new authority check
    pub authority_to_delete: AccountInfo<'info>,
    #[account(mut, seeds = [World::seed(), &world_id.to_be_bytes()], bump)]
    pub world: Account<'info, World>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveSystem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub world: Account<'info, World>,
    /// CHECK: Used for the pda derivation
    pub system: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveSystem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub world: Account<'info, World>,
    /// CHECK: Used for the pda derivation
    pub system: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(extra_seed: Option<String>)]
pub struct AddEntity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = World::size(), seeds = [Entity::seed(), &world.id.to_be_bytes(),
    &match extra_seed {
        Some(ref seed) => [0; 8],
        None => world.entities.to_be_bytes()
    },
    match extra_seed {
        Some(ref seed) => seed.as_bytes(),
        None => &[],
    }], bump)]
    pub entity: Account<'info, Entity>,
    #[account(mut)]
    pub world: Account<'info, World>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeComponent<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: component data check
    pub data: AccountInfo<'info>,
    #[account()]
    pub entity: Account<'info, Entity>,
    /// CHECK: component program check
    pub component_program: AccountInfo<'info>,
    /// CHECK: authority check
    pub authority: AccountInfo<'info>,
    #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
    /// CHECK: instruction sysvar check
    pub instruction_sysvar_account: UncheckedAccount<'info>,
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
            authority: self.authority.to_account_info(),
            instruction_sysvar_account: self.instruction_sysvar_account.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

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
#[derive(Debug)]
pub struct World {
    pub id: u64,
    pub entities: u64,
    pub authorities: Vec<Pubkey>,
    pub permissionless: bool,
    pub systems: Vec<u8>,
}

impl Default for World {
    fn default() -> Self {
        Self {
            id: 0,
            entities: 0,
            authorities: Vec::new(),
            permissionless: true,
            systems: Vec::new(),
        }
    }
}

impl World {
    fn space_for_authorities(auths: usize, systems_space: usize) -> usize {
        16 + 8 + 32 * auths + 1 + 8 + systems_space
    }
}

#[derive(
    anchor_lang::prelude::borsh::BorshSerialize,
    anchor_lang::prelude::borsh::BorshDeserialize,
    Default,
    Debug
)]
pub struct WorldSystems {
    pub approved_systems: BTreeSet<Pubkey>,
}

impl World {
    pub fn seed() -> &'static [u8] {
        b"world"
    }

    pub fn size() -> usize {
        16 + 8 + 1 + 8
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

#[account]
#[derive(InitSpace, Default)]
pub struct SystemWhitelist {}

impl SystemWhitelist {
    pub fn seed() -> &'static [u8] {
        b"whitelist"
    }

    pub fn size() -> usize {
        8 + Registry::INIT_SPACE
    }
}

/// Builds the context for updating a component.
pub fn build_update_context<'info>(
    component_program: UncheckedAccount<'info>,
    component: UncheckedAccount<'info>,
    authority: Signer<'info>,
    instruction_sysvar_account: UncheckedAccount<'info>,
) -> CpiContext<'info, 'info, 'info, 'info, bolt_component::cpi::accounts::Update<'info>> {
    let cpi_program = component_program.to_account_info();
    let cpi_accounts = bolt_component::cpi::accounts::Update {
        bolt_component: component.to_account_info(),
        authority: authority.to_account_info(),
        instruction_sysvar_account: instruction_sysvar_account.to_account_info(),
    };
    CpiContext::new(cpi_program, cpi_accounts)
}
