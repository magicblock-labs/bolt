use anchor_cli::config::{Config, ConfigOverride};
use anchor_client::solana_client::rpc_config::RpcSendTransactionConfig;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::{read_keypair_file, Keypair};
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anyhow::{anyhow, Result};
use std::rc::Rc;
use anchor_client::Client;
use world::{accounts, instruction, World, ID};

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
    input.parse::<Pubkey>().map_err(|_| anyhow!(error_message.to_string()))}

pub fn authorize(cfg_override: &ConfigOverride, world: String, new_authority: String) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let new_authority_pubkey = parse_pubkey(&new_authority, "Invalid new authority public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let world_account = program.account::<World>(world_pubkey)?;
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
        .signer(&payer)
        .send()?;

    println!(
        "Authority {} added to world {} with signature {}",
        new_authority, world, signature
    );

    Ok(())
}

pub fn deauthorize(cfg_override: &ConfigOverride, world: String, authority_to_delete: String) -> Result<()> {
    let world_pubkey = parse_pubkey(&world, "Invalid world public key")?;
    let authority_to_delete_pubkey = parse_pubkey(&authority_to_delete, "Invalid authority public key")?;

    let (client, payer) = setup_client(cfg_override)?;
    let program = client.program(ID)?;

    let world_account = program.account::<World>(world_pubkey)?;
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
        .signer(&payer)
        .send_with_spinner_and_config(RpcSendTransactionConfig {
            skip_preflight: true,
            ..RpcSendTransactionConfig::default()
        })?;

    println!(
        "Authority {} removed from world {} with signature {}",
        authority_to_delete, world, signature
    );

    Ok(())
}

pub fn approve_system(cfg_override: &ConfigOverride, world: String, system_to_approve: String) -> Result<()> {
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
        .signer(&payer)
        .send()?;

    println!(
        "System {} approved for world {} with signature {}",
        system_to_approve, world, signature
    );

    Ok(())
}

pub fn remove_system(cfg_override: &ConfigOverride, world: String, system_to_remove: String) -> Result<()> {
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
        .signer(&payer)
        .send()?;

    println!(
        "System {} removed from world {} with signature {}",
        system_to_remove, world, signature
    );

    Ok(())
}