export enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

import { anchor, BN } from "../clients/bolt-sdk/lib";
import { type World } from "../target/types/world";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { Keypair, PublicKey } from "@solana/web3.js";

export class Framework {
  provider: anchor.AnchorProvider;
  worldProgram: anchor.Program<World>;
  exampleComponentPosition: anchor.Program<Position>;
  exampleComponentVelocity: anchor.Program<Velocity>;
  systemSimpleMovement: anchor.Program<SystemSimpleMovement>;
  systemFly: anchor.Program<SystemFly>;
  systemApplyVelocity: anchor.Program<SystemApplyVelocity>;

  worldPda: PublicKey;
  worldId: BN;

  secondAuthority: PublicKey;

  entity1Pda: PublicKey;
  entity2Pda: PublicKey;
  entity4Pda: PublicKey;

  componentPositionEntity1Pda: PublicKey;
  componentVelocityEntity1Pda: PublicKey;

  componentPositionEntity4Pda: PublicKey;

  constructor() {
    this.secondAuthority = Keypair.generate().publicKey;
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
