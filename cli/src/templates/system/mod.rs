use anchor_cli::Files;
use heck::ToSnakeCase;
use std::path::Path;

/// Create a system which operates on a Position component.
pub fn create_system_template_simple(name: &str, program_path: &Path) -> Files {
    let program_id = anchor_cli::rust_template::get_or_create_program_id(name);
    let program_name = name.to_snake_case();
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(include_str!("lib.rs"), program_id=program_id, program_name=program_name)
    )]
}
