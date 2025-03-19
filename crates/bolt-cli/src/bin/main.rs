use anyhow::Result;
use clap::Parser;

#[tokio::main]
async fn main() -> Result<()> {
    bolt_cli::entry(bolt_cli::Opts::parse()).await
}
