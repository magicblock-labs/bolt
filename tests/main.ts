import "./low-level/bolt";
import "./intermediate-level/bolt";

import { anchor } from "../clients/bolt-sdk/lib";
import { type World } from "../target/types/world";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";

export class Framework {
    provider: anchor.AnchorProvider;
    worldProgram: anchor.Program<World>;
    exampleComponentPosition: anchor.Program<Position>;
    exampleComponentVelocity: anchor.Program<Velocity>;
    systemSimpleMovement: anchor.Program<SystemSimpleMovement>;
    systemFly: anchor.Program<SystemFly>;
    systemApplyVelocity: anchor.Program<SystemApplyVelocity>;

    constructor() {}

    async initialize() {
        this.worldProgram = anchor.workspace.World;
        this.exampleComponentPosition = anchor.workspace.Position;
        this.exampleComponentVelocity = anchor.workspace.Velocity;
        this.systemSimpleMovement = anchor.workspace.SystemSimpleMovement;
        this.systemFly = anchor.workspace.SystemFly;
        this.systemApplyVelocity = anchor.workspace.SystemApplyVelocity;

        this.provider = anchor.AnchorProvider.env();
        anchor.setProvider(this.provider);
    }
}
