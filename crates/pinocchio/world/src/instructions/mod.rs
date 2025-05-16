mod add_authority;
pub use add_authority::*;

mod add_entity;
pub use add_entity::*;

mod apply_system;
pub use apply_system::*;

mod apply_system_session;
pub use apply_system_session::*;

mod approve_system;
pub use approve_system::*;

mod destroy_component;
pub use destroy_component::*;

mod initialize_component;
pub use initialize_component::*;

mod initialize_registry;
pub use initialize_registry::*;

mod initialize_new_world;
pub use initialize_new_world::*;

mod remove_authority;
pub use remove_authority::*;

mod remove_system;
pub use remove_system::*;

use pinocchio::program_error::ProgramError;

pub const INITIALIZE_REGISTRY_DISCRIMINATOR: u64 = 4321548737212364221;
pub const INITIALIZE_NEW_WORLD_DISCRIMINATOR: u64 = 7118163274173538327;
pub const ADD_AUTHORIITY_DISCRIMINATOR: u64 = 13217455069452700133;
pub const REMOVE_AUTHORIITY_DISCRIMINATOR: u64 = 15585545156648003826;
pub const APPROVE_SYSTEM_DISCRIMINATOR: u64 = 8777308090533520754;
pub const REMOVE_SYSTEM_DISCRIMINATOR: u64 = 8688994685429436634;
pub const ADD_ENTITY_DISCRIMINATOR: u64 = 4121062988444201379;
pub const INITIALIZE_COMPONENT_DISCRIMINATOR: u64 = 2179155133888827172;
pub const DESTROY_COMPONENT_DISCRIMINATOR: u64 = 5321952129328727336;
pub const APPLY_DISCRIMINATOR: u64 = 16258613031726085112;
pub const APPLY_WITH_SESSION_DISCRIMINATOR: u64 = 7459768094276011477;

#[repr(u64)]
pub enum WorldInstruction {
    InitializeRegistry = INITIALIZE_REGISTRY_DISCRIMINATOR,
    InitializeNewWorld = INITIALIZE_NEW_WORLD_DISCRIMINATOR,
    AddAuthority = ADD_AUTHORIITY_DISCRIMINATOR,
    RemoveAuthority = REMOVE_AUTHORIITY_DISCRIMINATOR,
    ApproveSystem = APPROVE_SYSTEM_DISCRIMINATOR,
    RemoveSystem = REMOVE_SYSTEM_DISCRIMINATOR,
    AddEntity = ADD_ENTITY_DISCRIMINATOR,
    InitilizeComponent = INITIALIZE_COMPONENT_DISCRIMINATOR,
    DestroyComponent = DESTROY_COMPONENT_DISCRIMINATOR,
    Apply = APPLY_DISCRIMINATOR,
    ApplyWithSession = APPLY_WITH_SESSION_DISCRIMINATOR,
}

impl TryFrom<u64> for WorldInstruction {
    type Error = ProgramError;

    fn try_from(byte: u64) -> Result<Self, Self::Error> {
        match byte {
            INITIALIZE_REGISTRY_DISCRIMINATOR => Ok(WorldInstruction::InitializeRegistry),
            INITIALIZE_NEW_WORLD_DISCRIMINATOR => Ok(WorldInstruction::InitializeNewWorld),
            ADD_AUTHORIITY_DISCRIMINATOR => Ok(WorldInstruction::AddAuthority),
            REMOVE_AUTHORIITY_DISCRIMINATOR => Ok(WorldInstruction::RemoveAuthority),
            APPROVE_SYSTEM_DISCRIMINATOR => Ok(WorldInstruction::ApproveSystem),
            REMOVE_SYSTEM_DISCRIMINATOR => Ok(WorldInstruction::RemoveSystem),
            ADD_ENTITY_DISCRIMINATOR => Ok(WorldInstruction::AddEntity),
            INITIALIZE_COMPONENT_DISCRIMINATOR => Ok(WorldInstruction::InitilizeComponent),
            DESTROY_COMPONENT_DISCRIMINATOR => Ok(WorldInstruction::DestroyComponent),
            APPLY_DISCRIMINATOR => Ok(WorldInstruction::Apply),
            APPLY_WITH_SESSION_DISCRIMINATOR => Ok(WorldInstruction::ApplyWithSession),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}
