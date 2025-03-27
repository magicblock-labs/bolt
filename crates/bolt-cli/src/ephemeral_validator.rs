use anyhow::Result;
use std::process::Stdio;

pub struct EphemeralValidator;

impl EphemeralValidator {
    pub fn is_available() -> bool {
        which::which("ephemeral-validator").is_ok()
    }

    async fn wait_for_basenet() -> Result<()> {
        let balance = tokio::spawn(async move {
            loop {
                let status = std::process::Command::new("solana")
                    .arg("balance")
                    .args(&["-u", "localhost"])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status()
                    .expect("Failed to check solana balance");
                if status.success() {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        });
        balance.await.expect("Failed to check solana balance");
        Ok(())
    }

    pub async fn start() -> Result<Self> {
        if !Self::is_available() {
            return Err(anyhow::anyhow!("ephemeral-validator not available"));
        }
        Self::wait_for_basenet().await?;
        Self::cleanup()?;
        let temp_file = std::env::temp_dir().join("ephemeral-validator.toml");
        std::fs::write(
            &temp_file,
            include_str!("templates/ephemeral-validator.toml"),
        )
        .expect("Failed to write ephemeral validator config");
        tokio::process::Command::new("ephemeral-validator")
            .arg(temp_file)
            .spawn()
            .expect("Failed to start ephemeral validator");
        println!("Ephemeral validator started");

        Ok(Self)
    }

    pub fn cleanup() -> Result<()> {
        let mut system = sysinfo::System::new_all();
        system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        let processes = system.processes();
        for process in processes.values() {
            if let Some(name) = process
                .exe()
                .and_then(|path| path.file_name())
                .and_then(|name| name.to_str())
            {
                if name == "ephemeral-validator" {
                    process
                        .kill_with(sysinfo::Signal::Term)
                        .expect("Failed to kill ephemeral validator");
                }
            }
        }
        Ok(())
    }
}

impl Drop for EphemeralValidator {
    fn drop(&mut self) {
        if EphemeralValidator::is_available() {
            EphemeralValidator::cleanup().expect("Failed to cleanup ephemeral validator");
        }
    }
}
