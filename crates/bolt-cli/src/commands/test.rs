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
        // Propagate the result of running the underlying anchor tests so failures
        // produce a non-zero exit code for callers (e.g., CI workflows).
        anchor_cli::entry(opts)
    });
    if !skip_local_validator {
        if let Ok(_ephemeral_validator) = EphemeralValidator::start().await {
            // Keep the validator alive while tests run by retaining the handle
            // in scope, and return the actual test result.
            return anchor.await.unwrap_or_else(|e| Err(anyhow::anyhow!("Failed to run anchor: {}", e)));
        }
    }
    // Return the actual result when not using the ephemeral validator or if it failed to start.
    anchor.await.unwrap_or_else(|e| Err(anyhow::anyhow!("Failed to run anchor: {}", e)))
}
