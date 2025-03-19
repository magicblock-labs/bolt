use anchor_cli::config::ConfigOverride;
use anyhow::Result;

use crate::EphemeralValidator;

#[allow(clippy::too_many_arguments)]
pub async fn test(
    cfg_override: ConfigOverride,
    command: anchor_cli::Command,
    skip_local_validator: bool,
) -> Result<()> {
    let anchor = tokio::spawn(async move {
        let opts = anchor_cli::Opts {
            cfg_override,
            command,
        };
        anchor_cli::entry(opts).ok();
    });
    if !skip_local_validator {
        if let Ok(_ephemeral_validator) = EphemeralValidator::start().await {
            anchor.await.ok();
            return Ok(());
        }
    }
    anchor.await.expect("Failed to run anchor");
    Ok(())
}
