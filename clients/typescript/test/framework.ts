export enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

import { anchor, BN } from "../lib";
import { type World } from "../../../target/types/world";
import { type Position } from "../../../target/types/position";
import { type Velocity } from "../../../target/types/velocity";
import { type SystemSimpleMovement } from "../../../target/types/system_simple_movement";
import { type SystemFly } from "../../../target/types/system_fly";
import { type SystemApplyVelocity } from "../../../target/types/system_apply_velocity";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SystemWithManyComponents } from "../../../target/types/system_with_many_components";
import { Large } from "../../../target/types/large";
import { Small } from "../../../target/types/small";
import { SystemWithFewComponents } from "../../../target/types/system_with_few_components";

export class Framework {
  provider: anchor.AnchorProvider;
  acceleratorProvider: anchor.AnchorProvider;
  worldProgram: anchor.Program<World>;
  exampleComponentPosition: anchor.Program<Position>;
  exampleComponentVelocity: anchor.Program<Velocity>;
  systemSimpleMovement: anchor.Program<SystemSimpleMovement>;
  systemFly: anchor.Program<SystemFly>;
  systemApplyVelocity: anchor.Program<SystemApplyVelocity>;
  systemWithManyComponents: anchor.Program<SystemWithManyComponents>;
  systemWithFewComponents: anchor.Program<SystemWithFewComponents>;
  componentLarge: anchor.Program<Large>;
  componentSmall: anchor.Program<Small>;
  worldPda: PublicKey;
  worldId: BN;

  secondAuthority: PublicKey;

  entity1Pda: PublicKey;
  entity2Pda: PublicKey;
  entity4Pda: PublicKey;
  acceleratedEntityPda: PublicKey;

  acceleratedComponentPositionPda: PublicKey;
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
    this.systemWithManyComponents = anchor.workspace.SystemWithManyComponents;
    this.systemWithFewComponents = anchor.workspace.SystemWithFewComponents;
    this.componentLarge = anchor.workspace.Large;
    this.componentSmall = anchor.workspace.Small;

    this.provider = anchor.AnchorProvider.local();
    anchor.setProvider(this.provider);

    this.acceleratorProvider = new anchor.AnchorProvider(
      new Connection("http://localhost:7799", "processed"),
      anchor.Wallet.local(),
    );
  }

  consume(line: string): number {
    let consumed = line.split(" consumed ")[1].split(" of ")[0];
    return parseInt(consumed);
  }

  report(log: string[]) {
    var cpi: number[] = [];
    var worldReport: number = 0;
    for (let index in log) {
      let line = log[index];
      if (line.includes(" consumed ")) {
        if (!line.includes("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n")) {
          cpi.push(this.consume(line));
        } else {
          worldReport = this.consume(line);
        }
      }
    }
    let total = cpi.reduce((a, b) => a + b, 0);
    let numberOfInstructions = cpi.length;
    console.log(`Total CPI Consumed: ${total}`);
    console.log(`Number of Instructions: ${numberOfInstructions}`);
    console.log(`World Report: ${worldReport}`);
}
