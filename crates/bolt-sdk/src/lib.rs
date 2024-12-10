use anchor_lang::{prelude::*, InstructionData};
use solana_sdk::instruction::Instruction;

declare_program!(world);

pub mod wasm_bindgen;

pub fn find_registry_pda() -> Pubkey {
    Pubkey::find_program_address(&[b"registry"], &world::ID).0
}

pub fn create_initialize_registry_instruction(payer: Pubkey, registry: Pubkey) -> Instruction {
    let args = world::client::args::InitializeRegistry {};
    let system_program = anchor_lang::solana_program::system_program::id();
    let accounts = world::client::accounts::InitializeRegistry { payer, registry, system_program };
    Instruction::new_with_borsh(world::ID, &args.data(), accounts.to_account_metas(None))
}

#[cfg(test)]
mod tests {
    use solana_client::nonblocking::rpc_client::RpcClient;
    use solana_sdk::commitment_config::CommitmentConfig;
    use solana_sdk::signature::read_keypair_file;
    use solana_sdk::{instruction::Instruction, signer::Signer, transaction::Transaction};
    use super::*;

    #[tokio::test]
    async fn it_works() {
        let client = RpcClient::new("https://api.devnet.solana.com".to_string());
        let blockhash = client.get_latest_blockhash().await.unwrap();
        let keypair = read_keypair_file("/root/.config/solana/id.json").unwrap();
        let initialize_registry_accounts = world::client::accounts::InitializeRegistry {
            payer: keypair.pubkey(),
            registry: find_registry_pda(),
            system_program: anchor_lang::solana_program::system_program::id(),
        };
        let initialize_registry_args = world::client::args::InitializeRegistry {};
        let cluster = anchor_client::Cluster::Devnet;
        let commitment = CommitmentConfig::confirmed();
        let anchor_client = anchor_client::Client::new_with_options(cluster, &keypair, commitment);
        let program = anchor_client.program(world::ID).unwrap();
        let mut transaction = program.request().accounts(initialize_registry_accounts).args(initialize_registry_args).transaction().unwrap();
        transaction.sign(&[&keypair], blockhash);
        let result = client.send_transaction(&transaction).await.unwrap();
        println!("Blockhash: {:?}", blockhash);
        println!("Result: {:?}", result);
    }
}
