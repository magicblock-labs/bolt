export enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

import { writeFileSync } from "fs";
import { resolve } from "path";
import { anchor, BN } from "../lib";
import { type World } from "../../../target/types/world";
import { type Position } from "../../../target/types/position";
import { type Velocity } from "../../../target/types/velocity";
import { type SystemSimpleMovement } from "../../../target/types/system_simple_movement";
import { type SystemFly } from "../../../target/types/system_fly";
import { type SystemApplyVelocity } from "../../../target/types/system_apply_velocity";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Small } from "../../../target/types/small";
import { With1Component } from "../../../target/types/with_1_component";
import { With2Components } from "../../../target/types/with_2_components";
import { With3Components } from "../../../target/types/with_3_components";
import { With4Components } from "../../../target/types/with_4_components";
import { With5Components } from "../../../target/types/with_5_components";
import { With6Components } from "../../../target/types/with_6_components";
import { With7Components } from "../../../target/types/with_7_components";
import { With8Components } from "../../../target/types/with_8_components";
import { With9Components } from "../../../target/types/with_9_components";
import { With10Components } from "../../../target/types/with_10_components";
import { ExampleBundle } from "../../../target/types/example_bundle";

export class Framework {
  provider: anchor.AnchorProvider;
  acceleratorProvider: anchor.AnchorProvider;
  worldProgram: anchor.Program<World>;
  exampleComponentPosition: anchor.Program<Position>;
  exampleComponentVelocity: anchor.Program<Velocity>;
  exampleBundle: anchor.Program<ExampleBundle>;
  systemSimpleMovement: anchor.Program<SystemSimpleMovement>;
  systemFly: anchor.Program<SystemFly>;
  systemApplyVelocity: anchor.Program<SystemApplyVelocity>;
  systemWith1Component: anchor.Program<With1Component>;
  systemWith2Components: anchor.Program<With2Components>;
  systemWith3Components: anchor.Program<With3Components>;
  systemWith4Components: anchor.Program<With4Components>;
  systemWith5Components: anchor.Program<With5Components>;
  systemWith6Components: anchor.Program<With6Components>;
  systemWith7Components: anchor.Program<With7Components>;
  systemWith8Components: anchor.Program<With8Components>;
  systemWith9Components: anchor.Program<With9Components>;
  systemWith10Components: anchor.Program<With10Components>;
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
  bundlePositionEntity1Pda: PublicKey;
  componentVelocityEntity1Pda: PublicKey;
  bundleVelocityEntity1Pda: PublicKey;
  componentPositionEntity4Pda: PublicKey;

  constructor() {
    this.secondAuthority = Keypair.generate().publicKey;
    this.worldProgram = anchor.workspace.World;
    this.exampleComponentPosition = anchor.workspace.Position;
    this.exampleComponentVelocity = anchor.workspace.Velocity;
    this.exampleBundle = anchor.workspace.ExampleBundle;
    this.systemSimpleMovement = anchor.workspace.SystemSimpleMovement;
    this.systemFly = anchor.workspace.SystemFly;
    this.systemApplyVelocity = anchor.workspace.SystemApplyVelocity;
    this.componentSmall = anchor.workspace.Small;
    this.systemWith1Component = anchor.workspace.With1Component;
    this.systemWith2Components = anchor.workspace.With2Components;
    this.systemWith3Components = anchor.workspace.With3Components;
    this.systemWith4Components = anchor.workspace.With4Components;
    this.systemWith5Components = anchor.workspace.With5Components;
    this.systemWith6Components = anchor.workspace.With6Components;
    this.systemWith7Components = anchor.workspace.With7Components;
    this.systemWith8Components = anchor.workspace.With8Components;
    this.systemWith9Components = anchor.workspace.With9Components;
    this.systemWith10Components = anchor.workspace.With10Components;

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

  report(log: string[]): {
    cpiCount: number;
    totalCpiCU: number;
    totalCu: number;
  } {
    var cpi: number[] = [];
    var worldReport: number = 0;
    for (let index in log) {
      let line = log[index];
      if (line.includes(" consumed ")) {
        if (!line.includes("wor1DcaDr8AeBdaf5bqeBQUY9My2sgZwtanRcaALE9L")) {
          cpi.push(this.consume(line));
        } else {
          worldReport = this.consume(line);
        }
      }
    }
    let total = cpi.reduce((a, b) => a + b, 0);
    let numberOfInstructions = cpi.length;

    return {
      cpiCount: numberOfInstructions,
      totalCpiCU: total,
      totalCu: worldReport,
    };
  }

  saveReport(reports: any[]) {
    const projectRoot = process.cwd();
    const filePath = resolve(projectRoot, "docs", "REPORT.md");

    let report = "```mermaid\n";
    report += `%%{init: {"xyChart": {"width": 1200, "height": 400, "xAxis": {}}}}%%\n`;
    report += "xychart\n";
    report += '    title "Bolt Apply System Cost"\n';
    report += "    x-axis [";
    for (let i = 0; i < reports.length; i++) {
      report += `"${i + 1}C-CPIs:${reports[i].cpiCount}"`;
      if (i < reports.length - 1) {
        report += ",";
      }
    }
    report += "]\n";
    report += '    y-axis "CU" 5000 --> 200000\n';
    report += "    bar [";
    for (let i = 0; i < reports.length; i++) {
      report += reports[i].totalCu;
      if (i < reports.length - 1) {
        report += ",";
      }
    }
    report += "]\n";
    report += "    bar [";
    for (let i = 0; i < reports.length; i++) {
      report += reports[i].totalCpiCU;
      if (i < reports.length - 1) {
        report += ",";
      }
    }
    report += "]\n";
    report += "```\n";

    writeFileSync(filePath, report);
  }
}
