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
  componentLargeEntity1Pda: PublicKey;
  componentPositionEntity4Pda: PublicKey;
  componentSmallEntity1Pda: PublicKey;

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
}

// example input
// [
//   'Program WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n invoke [1]',
//   'Program log: Instruction: Apply',
//   'Program A3kNNSgmkTNA5V1qtnrbtNeqKrYHNxUMCTkqTDaQzE97 invoke [2]',
//   'Program log: Instruction: BoltExecute',
//   'Program A3kNNSgmkTNA5V1qtnrbtNeqKrYHNxUMCTkqTDaQzE97 consumed 3679 of 191671 compute units',
//   'Program return: A3kNNSgmkTNA5V1qtnrbtNeqKrYHNxUMCTkqTDaQzE97 BQAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAei0UnvLCu8bsxLLo92w4UVq1z4LrLIGvtTpkos13GLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6LRSe8sK7xuzEsuj3bDhRWrXPgussga+1OmSizXcYtAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHotFJ7ywrvG7MSy6PdsOFFatc+C6yyBr7U6ZKLNdxi0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAei0UnvLCu8bsxLLo92w4UVq1z4LrLIGvtTpkos13GLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6LRSe8sK7xuzEsuj3bDhRWrXPgussga+1OmSizXcYs=',
//   'Program A3kNNSgmkTNA5V1qtnrbtNeqKrYHNxUMCTkqTDaQzE97 success',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX invoke [2]',
//   'Program log: Instruction: Update',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX consumed 4732 of 183865 compute units',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX success',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX invoke [2]',
//   'Program log: Instruction: Update',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX consumed 4732 of 176143 compute units',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX success',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX invoke [2]',
//   'Program log: Instruction: Update',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX consumed 4732 of 168421 compute units',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX success',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX invoke [2]',
//   'Program log: Instruction: Update',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX consumed 4732 of 160699 compute units',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX success',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX invoke [2]',
//   'Program log: Instruction: Update',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX consumed 4732 of 152977 compute units',
//   'Program FJjiJoz799Q6NqYffXbsFFj1pBmwsQZgcoizCfWvM5HX success',
//   'Program WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n consumed 52251 of 200000 compute units',
//   'Program WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n success'
// ]