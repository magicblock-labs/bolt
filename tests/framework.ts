import type BN from "bn.js";

export enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

export function padCenter(value: string, width: number) {
  const length = value.length;
  if (width <= length) {
    return value;
  }
  const padding = (width - length) / 2;
  const align = width - padding;
  return value.padStart(align, " ").padEnd(width, " ");
}

export function logPosition(
  title: string,
  { x, y, z }: { x: BN; y: BN; z: BN },
) {
  console.log(" +----------------------------------+");
  console.log(` | ${padCenter(title, 32)} |`);
  console.log(" +-----------------+----------------+");
  console.log(` | X Position      | ${String(x).padEnd(14, " ")} |`);
  console.log(` | Y Position      | ${String(y).padEnd(14, " ")} |`);
  console.log(` | Z Position      | ${String(z).padEnd(14, " ")} |`);
  console.log(" +-----------------+----------------+");
}

export function logVelocity(
  title: string,
  { x, y, z, lastApplied }: { x: BN; y: BN; z: BN; lastApplied: BN },
) {
  console.log(" +----------------------------------+");
  console.log(` | ${padCenter(title, 32)} |`);
  console.log(" +-----------------+----------------+");
  console.log(` | X Velocity      | ${String(x).padEnd(14, " ")} |`);
  console.log(` | Y Velocity      | ${String(y).padEnd(14, " ")} |`);
  console.log(` | Z Velocity      | ${String(z).padEnd(14, " ")} |`);
  console.log(` | Last Applied    | ${String(lastApplied).padEnd(14, " ")} |`);
  console.log(" +-----------------+----------------+");
}

import { anchor } from "../clients/bolt-sdk/lib";
import { type World } from "../target/types/world";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

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
  entity5Pda: PublicKey;

  componentPositionEntity1Pda: PublicKey;
  componentVelocityEntity1Pda: PublicKey;

  componentPositionEntity4Pda: PublicKey;
  componentPositionEntity5Pda: PublicKey;

  sessionSigner: Keypair;
  sessionToken: PublicKey;

  constructor() {
    this.secondAuthority = Keypair.generate().publicKey;
    this.sessionSigner = Keypair.generate();
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
