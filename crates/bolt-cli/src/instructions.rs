use anchor_cli::config::{Config, ConfigOverride};
use anchor_client::solana_client::rpc_config::RpcSendTransactionConfig;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::{read_keypair_file, Keypair};
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anchor_client::Client;
use anyhow::{anyhow, Result};
use std::rc::Rc;
use world::{accounts, instruction, Registry, World, ID};

fn setup_client(cfg_override: &ConfigOverride) -> Result<(Client<Rc<Keypair>>, Keypair)> {
    let cfg = Config::discover(cfg_override)?.expect("Not in workspace.");
    let wallet_path = cfg.provider.wallet.clone();

    let payer = read_keypair_file(wallet_path.to_string())
        .map_err(|e| anyhow!("Failed to read keypair file: {}", e))?;

    let payer_for_client =
        Keypair::from_bytes(&payer.to_bytes()).expect("Failed to create Keypair from bytes");

    let client = Client::new_with_options(
        cfg.provider.cluster.clone(),
        Rc::new(payer_for_client),
        CommitmentConfig::confirmed(),
    );
    Ok((client, payer))
}

fn parse_pubkey(input: &str, error_message: &str) -> Result<Pubkey> {
    input
        .parse::<Pubkey>()
        .map_err(|_| anyhow!(error_message.to_string()))
}

pub async fn create_registry(cfg_override: &ConfigOverride) -> Result<()> {
    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let (registry_pda, _) = Pubkey::find_program_address(&[Registry::seed()], &ID);

    let signature = program
        .request()
        .accounts(accounts::InitializeRegistry {
            registry: registry_pda,
            payer: payer.pubkey(),
            system_program: system_program::ID,
        })
        .args(instruction::InitializeRegistry {})
        .signer(payer)
        .send()
        .await?;

    println!(
        "New registry {} created with signature {}",
        registry_pda, signature
    );

    Ok(())
}

pub async fn create_world(cfg_override: &ConfigOverride) -> Result<()> {
    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let (registry_pda, _) = Pubkey::find_program_address(&[Registry::seed()], &ID);

    let registry_account: Registry = program.account(registry_pda).await?;
    let world_id = registry_account.worlds;

    let (world_pda, _) =
        Pubkey::find_program_address(&[World::seed(), &world_id.to_be_bytes()], &ID);

    let signature = program
        .request()
        .accounts(accounts::InitializeNewWorld {
            payer: payer.pubkey(),
            world: world_pda,
            registry: registry_pda,
            system_program: system_program::ID,
        })
        .args(instruction::InitializeNewWorld {})
        .signer(payer)
        .send()
        .await?;

    println!(
        "New world created {} with world id {}. Transaction signature {}",
        world_pda, world_id, signature
    );

    Ok(())
}

pub async fn authorize(
    cfg_override: &ConfigOverride,
    world: String,
    new_authority: String,
) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let new_authority_pubkey = parse_pubkey(&new_authority, "Invalid new authority public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let world_account = program.account::<World>(world_pubkey).await?;
    let world_id = world_account.id;
    let signature = program
        .request()
        .accounts(accounts::AddAuthority {
            authority: payer.pubkey(),
            new_authority: new_authority_pubkey,
            system_program: system_program::ID,
            world: world_pubkey,
        })
        .args(instruction::AddAuthority { world_id })
        .signer(payer)
        .send()
        .await?;

    println!(
        "Authority {} added to world {} with signature {}",
        new_authority, world, signature
    );

    Ok(())
}

pub async fn deauthorize(
    cfg_override: &ConfigOverride,
    world: String,
    authority_to_delete: String,
) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let authority_to_delete_pubkey =
        parse_pubkey(&authority_to_delete, "Invalid authority public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let world_account = program.account::<World>(world_pubkey).await?;
    let world_id = world_account.id;
    let signature = program
        .request()
        .accounts(accounts::RemoveAuthority {
            authority: payer.pubkey(),
            authority_to_delete: authority_to_delete_pubkey,
            system_program: system_program::ID,
            world: world_pubkey,
        })
        .args(instruction::RemoveAuthority { world_id })
        .signer(payer)
        .send_with_spinner_and_config(RpcSendTransactionConfig {
            skip_preflight: true,
            ..RpcSendTransactionConfig::default()
        })
        .await?;

    println!(
        "Authority {} removed from world {} with signature {}",
        authority_to_delete, world, signature
    );

    Ok(())
}

pub async fn approve_system(
    cfg_override: &ConfigOverride,
    world: String,
    system_to_approve: String,
) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let system_to_approve_pubkey = parse_pubkey(&system_to_approve, "Invalid system public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let signature = program
        .request()
        .accounts(accounts::ApproveSystem {
            authority: payer.pubkey(),
            system: system_to_approve_pubkey,
            world: world_pubkey,
            system_program: system_program::ID,
        })
        .args(instruction::ApproveSystem {})
        .signer(payer)
        .send()
        .await?;

    println!(
        "System {} approved for world {} with signature {}",
        system_to_approve, world, signature
    );

    Ok(())
}

pub async fn remove_system(
    cfg_override: &ConfigOverride,
    world: String,
    system_to_remove: String,
) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let system_to_remove_pubkey = parse_pubkey(&system_to_remove, "Invalid system public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let signature = program
        .request()
        .accounts(accounts::RemoveSystem {
            authority: payer.pubkey(),
            system: system_to_remove_pubkey,
            world: world_pubkey,
            system_program: system_program::ID,
        })
        .args(instruction::RemoveSystem {})
        .signer(payer)
        .send()
        .await?;

    println!(
        "System {} removed from world {} with signature {}",
        system_to_remove, world, signature
    );

    Ok(())
}
