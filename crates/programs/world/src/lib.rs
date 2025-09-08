#![allow(clippy::manual_unwrap_or_default)]
use anchor_lang::{prelude::*, system_program};
use error::WorldError;
use std::collections::BTreeSet;

static CPI_AUTH_ADDRESS: Pubkey =
    Pubkey::from_str_const("B2f2y3QTBv346wE6nWKor72AUhUvFF6mPk7TWCF2QVhi"); // Seeds: ["cpi_auth", [251]]

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

#[program]
pub mod world {
    use super::*;
    use crate::error::WorldError;

    pub fn initialize_registry(_ctx: Context<InitializeRegistry>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_new_world(ctx: Context<InitializeNewWorld>) -> Result<()> {
        ctx.accounts.world.set_inner(World::default());
        ctx.accounts.world.id = ctx.accounts.registry.worlds;
        ctx.accounts.registry.worlds += 1;
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn add_authority(ctx: Context<AddAuthority>, world_id: u64) -> Result<()> {
        if ctx.accounts.world.authorities.is_empty()
            || (ctx
                .accounts
                .world
                .authorities
                .contains(ctx.accounts.authority.key)
                && !ctx
                    .accounts
                    .world
                    .authorities
                    .contains(ctx.accounts.new_authority.key))
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
            let lamports_diff =
                new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
            if lamports_diff > 0 {
                anchor_lang::solana_program::program::invoke(
                    &anchor_lang::solana_program::system_instruction::transfer(
                        ctx.accounts.authority.key,
                        ctx.accounts.world.to_account_info().key,
                        lamports_diff,
                    ),
                    &[
                        ctx.accounts.authority.to_account_info(),
                        ctx.accounts.world.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                )?;
            }
            ctx.accounts
                .world
                .to_account_info()
                .realloc(new_space, false)?;
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
            let lamports_diff =
                new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
            **ctx
                .accounts
                .world
                .to_account_info()
                .try_borrow_mut_lamports()? += lamports_diff;
            **ctx
                .accounts
                .authority
                .to_account_info()
                .try_borrow_mut_lamports()? -= lamports_diff;
            ctx.accounts
                .world
                .to_account_info()
                .realloc(new_space, false)?;
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

        let mut world_systems = ctx.accounts.world.systems();
        world_systems
            .approved_systems
            .insert(ctx.accounts.system.key());

        let encoded_world_systems = world_systems.try_to_vec()?;
        ctx.accounts.world.systems = encoded_world_systems.clone();

        let new_space = World::space_for_authorities(
            ctx.accounts.world.authorities.len(),
            encoded_world_systems.len(),
        );

        // Transfer to make it rent exempt
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_space);
        let lamports_diff =
            new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
        if lamports_diff > 0 {
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(
                    ctx.accounts.authority.key,
                    ctx.accounts.world.to_account_info().key,
                    lamports_diff,
                ),
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.world.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
        ctx.accounts
            .world
            .to_account_info()
            .realloc(new_space, false)?;
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

        let mut world_systems = ctx.accounts.world.systems();
        world_systems
            .approved_systems
            .remove(&ctx.accounts.system.key());

        let encoded_world_systems = world_systems.try_to_vec()?;
        ctx.accounts.world.systems = encoded_world_systems.clone();

        let new_space = World::space_for_authorities(
            ctx.accounts.world.authorities.len(),
            encoded_world_systems.len(),
        );

        if world_systems.approved_systems.is_empty() {
            ctx.accounts.world.permissionless = true;
        }

        // Remove the extra rent
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_space);
        let lamports_diff =
            new_minimum_balance.saturating_sub(ctx.accounts.world.to_account_info().lamports());
        **ctx
            .accounts
            .world
            .to_account_info()
            .try_borrow_mut_lamports()? += lamports_diff;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? -= lamports_diff;
        ctx.accounts
            .world
            .to_account_info()
            .realloc(new_space, false)?;
        msg!("Approved system: {:?}", world_systems);
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn add_entity(ctx: Context<AddEntity>, extra_seed: Option<Vec<u8>>) -> Result<()> {
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
        bolt_component::cpi::initialize(ctx.accounts.build(&[World::cpi_auth_seeds().as_slice()]))?;

        // Create the buffer account only if it does not already exist.
        // Subsequent applies reuse the same PDA and only reallocate its data.
        if ctx.accounts.buffer.lamports() == 0 {
            let size = 0;
            let lamports = Rent::get()?.minimum_balance(size);
            system_program::create_account(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::CreateAccount {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.buffer.to_account_info(),
                    },
                    &[&[
                        b"buffer",
                        ctx.accounts.data.key.as_ref(),
                        &[ctx.bumps.buffer],
                    ]],
                ),
                lamports,
                size as u64,
                &ID,
            )?;
        }

        Ok(())
    }

    pub fn delegate_component(
        ctx: Context<DelegateComponent>,
        commit_frequency_ms: u32,
        validator: Option<Pubkey>,
    ) -> Result<()> {
        let pda_seeds: &[&[u8]] = &[b"buffer", &ctx.accounts.component.key().to_bytes()];

        let del_accounts = ephemeral_rollups_sdk::cpi::DelegateAccounts {
            payer: &ctx.accounts.payer,
            pda: &ctx.accounts.component_buffer,
            owner_program: &ctx.accounts.world_program,
            buffer: &ctx.accounts.buffer_buffer,
            delegation_record: &ctx.accounts.buffer_delegation_record,
            delegation_metadata: &ctx.accounts.buffer_delegation_metadata,
            delegation_program: &ctx.accounts.delegation_program,
            system_program: &ctx.accounts.system_program,
        };

        let config = ephemeral_rollups_sdk::cpi::DelegateConfig {
            commit_frequency_ms,
            validator,
        };

        ephemeral_rollups_sdk::cpi::delegate_account(del_accounts, pda_seeds, config)?;

        bolt_component::cpi::delegate(
            CpiContext::new(
                ctx.accounts.component_program.to_account_info(),
                bolt_component::cpi::accounts::DelegateInput {
                    payer: ctx.accounts.payer.to_account_info(),
                    entity: ctx.accounts.entity.to_account_info(),
                    account: ctx.accounts.component.to_account_info(),
                    owner_program: ctx.accounts.component_program.to_account_info(),
                    buffer: ctx.accounts.buffer.to_account_info(),
                    delegation_metadata: ctx.accounts.delegation_metadata.to_account_info(),
                    delegation_record: ctx.accounts.delegation_record.to_account_info(),
                    delegation_program: ctx.accounts.delegation_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            commit_frequency_ms,
            validator,
        )?;

        Ok(())
    }

    #[derive(Accounts)]
    pub struct DelegateComponent<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        /// CHECK:
        #[account(mut)]
        pub component: AccountInfo<'info>,
        /// CHECK:
        #[account(mut)]
        pub component_buffer: AccountInfo<'info>,
        /// CHECK:`
        pub component_program: AccountInfo<'info>,
        /// CHECK:
        #[account(mut)]
        pub buffer: AccountInfo<'info>,
        /// CHECK:`
        #[account(mut)]
        pub delegation_record: AccountInfo<'info>,
        /// CHECK:`
        #[account(mut)]
        pub delegation_metadata: AccountInfo<'info>,
        /// CHECK:`
        pub delegation_program: AccountInfo<'info>,
        /// CHECK:`
        pub system_program: Program<'info, System>,
        /// CHECK:
        #[account()]
        pub entity: AccountInfo<'info>,
        /// CHECK:`
        pub world_program: AccountInfo<'info>,
        /// CHECK:
        #[account(mut)]
        pub buffer_buffer: AccountInfo<'info>,
        /// CHECK:`
        #[account(mut)]
        pub buffer_delegation_record: AccountInfo<'info>,
        /// CHECK:`
        #[account(mut)]
        pub buffer_delegation_metadata: AccountInfo<'info>,
    }

    pub fn destroy_component(ctx: Context<DestroyComponent>) -> Result<()> {
        bolt_component::cpi::destroy(ctx.accounts.build(&[World::cpi_auth_seeds().as_slice()]))?;
        Ok(())
    }

    pub fn apply<'info>(
        ctx: Context<'_, '_, '_, 'info, Apply<'info>>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_impl(
            &ctx.accounts.buffer,
            &ctx.accounts.authority,
            &ctx.accounts.world,
            &ctx.accounts.bolt_system,
            &ctx.accounts.cpi_auth,
            ctx.accounts.build(),
            args,
            None,
            ctx.remaining_accounts,
        )?;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Apply<'info> {
        /// CHECK: buffer data check
        #[account(mut)]
        pub buffer: AccountInfo<'info>,
        /// CHECK: bolt system program check
        #[account()]
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: authority check
        #[account(mut)]
        pub authority: Signer<'info>,
        #[account()]
        /// CHECK: cpi auth check
        pub cpi_auth: UncheckedAccount<'info>,
        #[account()]
        pub world: Account<'info, World>,
        pub system_program: Program<'info, System>,
    }

    impl<'info> Apply<'info> {
        pub fn build(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::BoltExecute<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::BoltExecute {
                authority: self.authority.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }

    pub fn apply_with_session<'info>(
        ctx: Context<'_, '_, '_, 'info, ApplyWithSession<'info>>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_impl(
            &ctx.accounts.buffer,
            &ctx.accounts.authority,
            &ctx.accounts.world,
            &ctx.accounts.bolt_system,
            &ctx.accounts.cpi_auth,
            ctx.accounts.build(),
            args,
            Some(&ctx.accounts.session_token),
            ctx.remaining_accounts,
        )?;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct ApplyWithSession<'info> {
        /// CHECK: buffer data check
        #[account(mut)]
        pub buffer: AccountInfo<'info>,
        /// CHECK: bolt system program check
        #[account()]
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: authority check
        #[account(mut)]
        pub authority: Signer<'info>,
        #[account()]
        /// CHECK: cpi auth check
        pub cpi_auth: UncheckedAccount<'info>,
        #[account()]
        pub world: Account<'info, World>,
        #[account(constraint = session_token.to_account_info().owner == &session_keys::ID)]
        pub session_token: Account<'info, session_keys::SessionToken>,
        pub system_program: Program<'info, System>,
    }

    impl<'info> ApplyWithSession<'info> {
        pub fn build(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::BoltExecute<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::BoltExecute {
                authority: self.authority.to_account_info(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }
}

#[allow(clippy::type_complexity, clippy::too_many_arguments)]
fn apply_impl<'info>(
    buffer: &AccountInfo<'info>,
    authority: &Signer<'info>,
    world: &Account<'info, World>,
    bolt_system: &UncheckedAccount<'info>,
    cpi_auth: &UncheckedAccount<'info>,
    cpi_context: CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::BoltExecute<'info>>,
    args: Vec<u8>,
    session_token: Option<&Account<'info, session_keys::SessionToken>>,
    remaining_accounts: &[AccountInfo<'info>],
) -> Result<()> {
    if !authority.is_signer && authority.key != &ID {
        return Err(WorldError::InvalidAuthority.into());
    }
    if !world.permissionless
        && !world
            .systems()
            .approved_systems
            .contains(&bolt_system.key())
    {
        return Err(WorldError::SystemNotApproved.into());
    }

    require!(buffer.data_len() == 0, WorldError::InvalidBufferAccount);

    let index = remaining_accounts
        .iter()
        .position(|x| x.key() == ID)
        .unwrap_or(remaining_accounts.len());

    // Authority check against component metadata (partial deserialize)
    for component in remaining_accounts[..index].iter().skip(1).step_by(2) {
        let data_ref = component.try_borrow_data()?;
        // Expect at least Anchor discriminator (8) + BoltMetadata (32)
        if data_ref.len() < 8 + 32 {
            return Err(WorldError::InvalidAuthority.into());
        }
        // BoltMetadata.authority is the last 32 bytes of the serialized component
        let start = 8; // Skip the discriminator
        let mut key_bytes = [0u8; 32];
        key_bytes.copy_from_slice(&data_ref[start..start + 32]);
        let component_authority = Pubkey::new_from_array(key_bytes);

        let unix_timestamp = Clock::get()?.unix_timestamp;
        if let Some(session_token) = session_token {
            if component_authority == ID {
                require!(
                    unix_timestamp < session_token.valid_until,
                    session_keys::SessionError::InvalidToken
                );
            } else {
                let validity_ctx = session_keys::ValidityChecker {
                    session_token: session_token.clone(),
                    session_signer: authority.clone(),
                    authority: component_authority,
                    target_program: ID,
                };
                require!(
                    session_token.validate(validity_ctx)?,
                    session_keys::SessionError::InvalidToken
                );
                require_eq!(
                    component_authority,
                    session_token.authority,
                    session_keys::SessionError::InvalidToken
                );
            }
        } else {
            require!(
                component_authority == ID
                    || (component_authority == *authority.key && authority.is_signer),
                WorldError::InvalidAuthority
            );
        }
    }

    for pair in remaining_accounts[..index].chunks(2) {
        let [program, component] = pair else { continue };
        buffer.realloc(component.data_len(), false)?;
        {
            let mut data = buffer.try_borrow_mut_data()?;
            data.copy_from_slice(component.try_borrow_data()?.as_ref());
        }

        if component.owner != bolt_system.key {
            bolt_component::cpi::set_owner(
                CpiContext::new_with_signer(
                    program.to_account_info(),
                    bolt_component::cpi::accounts::SetOwner {
                        cpi_auth: cpi_auth.to_account_info(),
                        component: component.to_account_info(),
                    },
                    &[World::cpi_auth_seeds().as_slice()],
                ),
                *bolt_system.key,
            )?;

            bolt_system::cpi::set_data(CpiContext::new_with_signer(
                bolt_system.to_account_info(),
                bolt_system::cpi::accounts::SetData {
                    cpi_auth: cpi_auth.to_account_info(),
                    buffer: buffer.to_account_info(),
                    component: component.to_account_info(),
                },
                &[World::cpi_auth_seeds().as_slice()],
            ))?;
        }
    }

    let cpi_remaining_accounts = remaining_accounts[..index]
        .iter()
        .skip(1)
        .step_by(2)
        .chain(remaining_accounts[index..].iter().skip(1))
        .cloned()
        .collect::<Vec<_>>();
    bolt_system::cpi::bolt_execute(
        cpi_context.with_remaining_accounts(cpi_remaining_accounts),
        args,
    )?;

    for pair in remaining_accounts[..index].chunks(2) {
        let [program, component] = pair else { continue };
        buffer.realloc(component.data_len(), false)?;
        {
            let mut data = buffer.try_borrow_mut_data()?;
            data.copy_from_slice(component.try_borrow_data()?.as_ref());
        }

        if *component.owner != program.key() {
            bolt_system::cpi::set_owner(
                CpiContext::new_with_signer(
                    bolt_system.to_account_info(),
                    bolt_system::cpi::accounts::SetOwner {
                        cpi_auth: cpi_auth.to_account_info(),
                        component: component.to_account_info(),
                    },
                    &[World::cpi_auth_seeds().as_slice()],
                ),
                program.key(),
            )?;

            if *component.owner != program.key() {
                return Err(WorldError::InvalidComponentOwner.into());
            }

            bolt_component::cpi::set_data(CpiContext::new_with_signer(
                program.to_account_info(),
                bolt_component::cpi::accounts::SetData {
                    cpi_auth: cpi_auth.to_account_info(),
                    buffer: buffer.to_account_info(),
                    component: component.to_account_info(),
                },
                &[World::cpi_auth_seeds().as_slice()],
            ))?;
        }
    }

    buffer.realloc(0, false)?;

    Ok(())
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
#[instruction(extra_seed: Option<Vec<u8>>)]
pub struct AddEntity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = World::size(), seeds = [Entity::seed(), &world.id.to_be_bytes(),
    &match extra_seed {
        Some(ref _seed) => [0; 8],
        None => world.entities.to_be_bytes()
    },
    match extra_seed {
        Some(ref seed) => seed,
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
    #[account()]
    /// CHECK: cpi auth check
    pub cpi_auth: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Buffer account
    #[account(mut, seeds = [b"buffer", data.key.as_ref()], bump)]
    pub buffer: UncheckedAccount<'info>,
}

impl<'info> InitializeComponent<'info> {
    pub fn build<'a, 'b, 'c>(
        &self,
        signer_seeds: &'a [&'b [&'c [u8]]],
    ) -> CpiContext<'a, 'b, 'c, 'info, bolt_component::cpi::accounts::Initialize<'info>> {
        let cpi_program = self.component_program.to_account_info();

        let cpi_accounts = bolt_component::cpi::accounts::Initialize {
            payer: self.payer.to_account_info(),
            data: self.data.to_account_info(),
            entity: self.entity.to_account_info(),
            authority: self.authority.to_account_info(),
            cpi_auth: self.cpi_auth.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds)
    }
}

#[derive(Accounts)]
pub struct DestroyComponent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    /// CHECK: receiver check
    pub receiver: AccountInfo<'info>,
    /// CHECK: component program check
    pub component_program: AccountInfo<'info>,
    /// CHECK: component program data check
    pub component_program_data: AccountInfo<'info>,
    #[account()]
    pub entity: Account<'info, Entity>,
    #[account(mut)]
    /// CHECK: component data check
    pub component: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: cpi auth check
    pub cpi_auth: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> DestroyComponent<'info> {
    pub fn build<'a, 'b, 'c>(
        &self,
        signer_seeds: &'a [&'b [&'c [u8]]],
    ) -> CpiContext<'a, 'b, 'c, 'info, bolt_component::cpi::accounts::Destroy<'info>> {
        let cpi_program = self.component_program.to_account_info();

        let cpi_accounts = bolt_component::cpi::accounts::Destroy {
            authority: self.authority.to_account_info(),
            receiver: self.receiver.to_account_info(),
            entity: self.entity.to_account_info(),
            component: self.component.to_account_info(),
            component_program_data: self.component_program_data.to_account_info(),
            cpi_auth: self.cpi_auth.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds)
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

    pub fn systems(&self) -> WorldSystems {
        if self.permissionless {
            return WorldSystems::default();
        }
        WorldSystems::try_from_slice(self.systems.as_ref()).unwrap_or_default()
    }
}

#[derive(
    anchor_lang::prelude::borsh::BorshSerialize,
    anchor_lang::prelude::borsh::BorshDeserialize,
    Default,
    Debug,
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

    pub const fn cpi_auth_seeds() -> [&'static [u8]; 2] {
        [b"cpi_auth", &[251]] // 251 is the pre-computed bump for cpi_auth.
    }

    pub const fn cpi_auth_address() -> &'static Pubkey {
        &CPI_AUTH_ADDRESS // This is the pre-computed address for cpi_auth.
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
