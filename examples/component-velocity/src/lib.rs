use bolt_lang::*;

declare_id!("CbHEFbSQdRN4Wnoby9r16umnJ1zWbULBHg4yqzGQonU1");

#[component(component_id = "component-velocity")]
pub struct Velocity {
    pub x: i64,
    pub y: i64,
    pub z: i64,
    pub last_applied: i64,
    #[max_len(20)]
    pub description: String,
}
