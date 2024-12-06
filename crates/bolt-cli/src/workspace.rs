use anchor_cli::config::{Config, ConfigOverride, WithPath};

// with_workspace ensures the current working directory is always the top level
// workspace directory, i.e., where the `Anchor.toml` file is located, before
// and after the closure invocation.
//
// The closure passed into this function must never change the working directory
// to be outside the workspace. Doing so will have undefined behavior.
pub fn with_workspace<R>(
    cfg_override: &ConfigOverride,
    f: impl FnOnce(&mut WithPath<Config>) -> R,
) -> R {
    set_workspace_dir_or_exit();

    let mut cfg = Config::discover(cfg_override)
        .expect("Previously set the workspace dir")
        .expect("Anchor.toml must always exist");

    let r = f(&mut cfg);

    set_workspace_dir_or_exit();

    r
}

pub fn set_workspace_dir_or_exit() {
    let d = match Config::discover(&ConfigOverride::default()) {
        Err(err) => {
            println!("Workspace configuration error: {err}");
            std::process::exit(1);
        }
        Ok(d) => d,
    };
    match d {
        None => {
            println!("Not in anchor workspace.");
            std::process::exit(1);
        }
        Some(cfg) => {
            match cfg.path().parent() {
                None => {
                    println!("Unable to make new program");
                }
                Some(parent) => {
                    if std::env::set_current_dir(parent).is_err() {
                        println!("Not in anchor workspace.");
                        std::process::exit(1);
                    }
                }
            };
        }
    }
}
