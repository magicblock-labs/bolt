use std::path::Path;
use anchor_cli::Files;
use heck::ToSnakeCase; // Import the trait

/// Create a system which operates on a Position component.
pub fn create_system_template_simple(name: &str, program_path: &Path) -> Files {
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(
            r#"use bolt_lang::*;
use position::Position;

declare_id!("{}");

#[system]
pub mod {} {{

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {{
        let position = &mut ctx.accounts.position;
        position.x += 1;
        position.y += 1;
        Ok(ctx.accounts)
    }}

    #[system_input]
    pub struct Components {{
        pub position: Position,
    }}

}}
"#,
            anchor_cli::rust_template::get_or_create_program_id(name),
            name.to_snake_case(),
        ),
    )]
}