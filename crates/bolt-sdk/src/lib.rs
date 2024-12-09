#[cfg(test)]
mod tests {
    use solana_client::nonblocking::rpc_client::RpcClient;

    #[tokio::test]
    async fn it_works() {
        let client = RpcClient::new("https://api.devnet.solana.com".to_string());
        let blockhash = client.get_latest_blockhash().await.unwrap();
        println!("Blockhash: {:?}", blockhash);
    }
}
