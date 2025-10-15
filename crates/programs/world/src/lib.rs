#![allow(clippy::manual_unwrap_or_default)]
use anchor_lang::prelude::*;
use error::WorldError;
use std::collections::BTreeSet;

pub mod utils;
use utils::discriminator_for;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

pub const BOLT_EXECUTE: [u8; 8] = discriminator_for("global:bolt_execute");
pub const UPDATE: [u8; 8] = discriminator_for("global:update");
pub const UPDATE_WITH_SESSION: [u8; 8] = discriminator_for("global:update_with_session");

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
    use anchor_lang::solana_program::program::invoke_signed;

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

    pub fn initialize_component(
        ctx: Context<InitializeComponent>,
        discriminator: Vec<u8>,
    ) -> Result<()> {
        if !ctx.accounts.authority.is_signer && ctx.accounts.authority.key != &ID {
            return Err(WorldError::InvalidAuthority.into());
        }
        // Pure Solana SDK logic for CPI to bolt_component::initialize
        use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

        // Prepare the accounts for the CPI
        let accounts = vec![
            AccountMeta::new_readonly(ctx.accounts.cpi_auth.key(), true),
            AccountMeta::new(ctx.accounts.payer.key(), true),
            AccountMeta::new(ctx.accounts.data.key(), false),
            AccountMeta::new_readonly(ctx.accounts.entity.key(), false),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ];

        let data = discriminator;

        let ix = Instruction {
            program_id: ctx.accounts.component_program.key(),
            accounts,
            data,
        };

        // CPI: invoke the instruction
        invoke_signed(
            &ix,
            &[
                ctx.accounts.cpi_auth.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.data.to_account_info(),
                ctx.accounts.entity.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[World::cpi_auth_seeds().as_slice()],
        )?;
        Ok(())
    }

    pub fn destroy_component(ctx: Context<DestroyComponent>, discriminator: Vec<u8>) -> Result<()> {
        // Pure Solana SDK logic for CPI to bolt_component::destroy
        use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

        // Prepare the accounts for the CPI (must match bolt_component::Destroy)
        let accounts = vec![
            AccountMeta::new_readonly(ctx.accounts.cpi_auth.key(), true),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
            AccountMeta::new(ctx.accounts.receiver.key(), false),
            AccountMeta::new_readonly(ctx.accounts.entity.key(), false),
            AccountMeta::new(ctx.accounts.component.key(), false),
            AccountMeta::new_readonly(ctx.accounts.component_program_data.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ];

        let data = discriminator;

        let ix = Instruction {
            program_id: ctx.accounts.component_program.key(),
            accounts,
            data,
        };

        // CPI: invoke the instruction
        invoke_signed(
            &ix,
            &[
                ctx.accounts.cpi_auth.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.receiver.to_account_info(),
                ctx.accounts.entity.to_account_info(),
                ctx.accounts.component.to_account_info(),
                ctx.accounts.component_program_data.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[World::cpi_auth_seeds().as_slice()],
        )?;
        Ok(())
    }

    pub fn apply<'info>(
        ctx: Context<'_, '_, '_, 'info, Apply<'info>>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_impl(ctx, BOLT_EXECUTE.to_vec(), args)
    }

    pub fn apply_with_discriminator<'info>(
        ctx: Context<'_, '_, '_, 'info, Apply<'info>>,
        system_discriminator: Vec<u8>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_impl(ctx, system_discriminator, args)
    }

    #[derive(Accounts)]
    pub struct Apply<'info> {
        /// CHECK: bolt system program check
        #[account()]
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: authority check
        #[account()]
        pub authority: Signer<'info>,
        /// CHECK: instruction sysvar check
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        pub instruction_sysvar_account: UncheckedAccount<'info>,
        #[account()]
        pub world: Account<'info, World>,
    }

    pub fn apply_with_session<'info>(
        ctx: Context<'_, '_, '_, 'info, ApplyWithSession<'info>>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_with_session_impl(ctx, BOLT_EXECUTE.to_vec(), args)
    }

    pub fn apply_with_session_and_discriminator<'info>(
        ctx: Context<'_, '_, '_, 'info, ApplyWithSession<'info>>,
        system_discriminator: Vec<u8>,
        args: Vec<u8>,
    ) -> Result<()> {
        apply_with_session_impl(ctx, system_discriminator, args)
    }

    #[derive(Accounts)]
    pub struct ApplyWithSession<'info> {
        /// CHECK: bolt system program check
        #[account()]
        pub bolt_system: UncheckedAccount<'info>,
        /// CHECK: authority check
        #[account()]
        pub authority: Signer<'info>,
        /// CHECK: instruction sysvar check
        #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
        pub instruction_sysvar_account: UncheckedAccount<'info>,
        #[account()]
        pub world: Account<'info, World>,
        #[account()]
        /// CHECK: The session token
        pub session_token: UncheckedAccount<'info>,
    }
}

pub fn apply_impl<'info>(
    ctx: Context<'_, '_, '_, 'info, Apply<'info>>,
    system_discriminator: Vec<u8>,
    args: Vec<u8>,
) -> Result<()> {
    let (pairs, results) = system_execute(
        &ctx.accounts.authority,
        &ctx.accounts.world,
        &ctx.accounts.bolt_system,
        system_discriminator,
        args,
        ctx.remaining_accounts.to_vec(),
    )?;

    use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
    use anchor_lang::solana_program::program::invoke_signed as invoke_signed_program;

    for ((program, component), result) in pairs.into_iter().zip(results.into_iter()) {
        let accounts = vec![
            AccountMeta::new_readonly(ctx.accounts.cpi_auth.key(), true),
            AccountMeta::new(component.key(), false),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
        ];

        let mut data = UPDATE.to_vec();
        let len_le = (result.len() as u32).to_le_bytes();
        data.extend_from_slice(&len_le);
        data.extend_from_slice(result.as_slice());

        let ix = Instruction {
            program_id: program.key(),
            accounts,
            data,
        };

        invoke_signed_program(
            &ix,
            &[
                ctx.accounts.cpi_auth.to_account_info(),
                component.clone(),
                ctx.accounts.authority.to_account_info(),
            ],
            &[World::cpi_auth_seeds().as_slice()],
        )?;
    }
    Ok(())
}

pub fn apply_with_session_impl<'info>(
    ctx: Context<'_, '_, '_, 'info, ApplyWithSession<'info>>,
    system_discriminator: Vec<u8>,
    args: Vec<u8>,
) -> Result<()> {
    let (pairs, results) = system_execute(
        &ctx.accounts.authority,
        &ctx.accounts.world,
        &ctx.accounts.bolt_system,
        system_discriminator,
        args,
        ctx.remaining_accounts.to_vec(),
    )?;

    use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
    use anchor_lang::solana_program::program::invoke_signed as invoke_signed_program;

    for ((program, component), result) in pairs.into_iter().zip(results.into_iter()) {
        let accounts = vec![
            AccountMeta::new_readonly(ctx.accounts.cpi_auth.key(), true),
            AccountMeta::new(component.key(), false),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
            AccountMeta::new_readonly(ctx.accounts.session_token.key(), false),
        ];

        let mut data = UPDATE_WITH_SESSION.to_vec();
        let len_le = (result.len() as u32).to_le_bytes();
        data.extend_from_slice(&len_le);
        data.extend_from_slice(result.as_slice());

        let ix = Instruction {
            program_id: program.key(),
            accounts,
            data,
        };

        invoke_signed_program(
            &ix,
            &[
                ctx.accounts.cpi_auth.to_account_info(),
                component.clone(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.session_token.to_account_info(),
            ],
            &[World::cpi_auth_seeds().as_slice()],
        )?;
    }
    Ok(())
}

#[allow(clippy::type_complexity)]
fn system_execute<'info>(
    authority: &Signer<'info>,
    world: &Account<'info, World>,
    bolt_system: &UncheckedAccount<'info>,
    system_discriminator: Vec<u8>,
    args: Vec<u8>,
    mut remaining_accounts: Vec<AccountInfo<'info>>,
) -> Result<(Vec<(AccountInfo<'info>, AccountInfo<'info>)>, Vec<Vec<u8>>)> {
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

    let mut pairs = Vec::new();
    while remaining_accounts.len() >= 2 {
        let program = remaining_accounts.remove(0);
        if program.key() == ID {
            break;
        }
        let component = remaining_accounts.remove(0);
        pairs.push((program, component));
    }

    let mut components_accounts = pairs
        .iter()
        .map(|(_, component)| component)
        .cloned()
        .collect::<Vec<_>>();
    components_accounts.append(&mut remaining_accounts);
    let remaining_accounts = components_accounts;

    let mut data = system_discriminator;
    let len_le = (args.len() as u32).to_le_bytes();
    data.extend_from_slice(&len_le);
    data.extend_from_slice(args.as_slice());

    use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
    use anchor_lang::solana_program::program::invoke;

    let mut accounts = vec![AccountMeta::new_readonly(authority.key(), false)];
    accounts.extend(
        remaining_accounts
            .iter()
            .map(|account| AccountMeta::new_readonly(account.key(), false)),
    );

    let mut account_infos = vec![authority.to_account_info()];
    account_infos.extend(
        remaining_accounts
            .iter()
            .map(|account| account.to_account_info()),
    );

    let ix = Instruction {
        program_id: bolt_system.key(),
        accounts,
        data,
    };

    invoke(&ix, &account_infos)?;

    // Extract return data using Solana SDK
    use anchor_lang::solana_program::program::get_return_data;
    let (pid, data) = get_return_data().ok_or(WorldError::InvalidSystemOutput)?;
    require_keys_eq!(pid, bolt_system.key(), WorldError::InvalidSystemOutput);
    let results: Vec<Vec<u8>> = borsh::BorshDeserialize::try_from_slice(&data)
        .map_err(|_| WorldError::InvalidSystemOutput)?;

    if results.len() != pairs.len() {
        return Err(WorldError::InvalidSystemOutput.into());
    }
    Ok((pairs, results))
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
    #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
    /// CHECK: instruction sysvar check
    pub instruction_sysvar_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
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
    #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
    /// CHECK: instruction sysvar check
    pub instruction_sysvar_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
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
