use anyhow::Result;
use clap::Parser;

fn main() -> Result<()> {
    bolt_cli::entry(bolt_cli::Opts::parse())
}
