use bolt_lang::*;

declare_id!("{program_id}");

#[component]
#[derive(Default)]
pub struct {program_name} {{
    pub x: i64,
    pub y: i64,
    pub z: i64,
    #[max_len(20)]
    pub description: String,
}}