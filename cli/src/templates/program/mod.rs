use anchor_cli::Files;
use heck::ToSnakeCase;
use std::path::Path; // Import the trait

pub fn create_program_template_single(name: &str, program_path: &Path) -> Files {
    let program_id = anchor_cli::rust_template::get_or_create_program_id(name);
    let program_name = name.to_snake_case();
    vec![(
        program_path.join("src").join("lib.rs"),
        format!(include_str!("single.lib.rs"), program_id=program_id, program_name=program_name),
    )]
}

/// Create a program with multiple files for instructions, state...
pub fn create_program_template_multiple(name: &str, program_path: &Path) -> Files {
    let src_path = program_path.join("src");
    let program_id = anchor_cli::rust_template::get_or_create_program_id(name);
    let program_name = name.to_snake_case();
    vec![
        (
            src_path.join("lib.rs"),
            format!(include_str!("multiple.lib.rs"), program_id=program_id, program_name=program_name),
        ),
        (
            src_path.join("constants.rs"),
            include_str!("constants.rs").into(),
        ),
        (
            src_path.join("error.rs"),
            include_str!("error.rs").into(),
        ),
        (
            src_path.join("instructions").join("mod.rs"),
            include_str!("instructions/mod.rs").into(),
        ),
        (
            src_path.join("instructions").join("initialize.rs"),
            include_str!("instructions/initialize.rs").into(),
        ),
        (
            src_path.join("state").join("mod.rs"),
            include_str!("state/mod.rs").into(),
        ),
    ]
}
