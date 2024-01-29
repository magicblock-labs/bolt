import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { ComponentPosition } from "../target/types/component_position";
import { ComponentVelocity } from "../target/types/component_velocity";
import { BoltComponent } from "../target/types/bolt_component";
import { SystemSimpleMovement } from "../target/types/system_simple_movement";
import { SystemFly } from "../target/types/system_fly";
import { SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { World } from "../target/types/world";
import { expect } from "chai";
import BN from "bn.js";
import {
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindWorldRegistryPda,
} from "../clients/bolt-sdk";

enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

function serializeArgs(args: any = {}) {
  const jsonString = JSON.stringify(args);
  const encoder = new TextEncoder();
  const binaryData = encoder.encode(jsonString);
  return Buffer.from(
    binaryData.buffer,
    binaryData.byteOffset,
    binaryData.byteLength
  );
}

describe("bolt", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const worldProgram = anchor.workspace.World as Program<World>;
  const boltComponentPositionProgram = anchor.workspace
    .ComponentPosition as Program<ComponentPosition>;
  const boltComponentVelocityProgram = anchor.workspace
    .ComponentVelocity as Program<ComponentVelocity>;
  const boltComponentProgramOrigin = anchor.workspace
    .BoltComponent as Program<BoltComponent>;

  const systemSimpleMovement = (
    anchor.workspace.SystemSimpleMovement as Program<SystemSimpleMovement>
  ).programId;
  const systemFly = (anchor.workspace.SystemFly as Program<SystemFly>)
    .programId;
  const applyVelocity = (
    anchor.workspace.SystemApplyVelocity as Program<SystemApplyVelocity>
  ).programId;

  let entity1: PublicKey;
  let entity2: PublicKey;
  let componentPositionEntity1: PublicKey;
  let componentPositionEntity2: PublicKey;
  let componentVelocityEntity1: PublicKey;

  it("InitializeWorldsRegistry", async () => {
    const registryPda = FindWorldRegistryPda(worldProgram.programId);
    await worldProgram.methods
      .initializeRegistry()
      .accounts({
        registry: registryPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("InitializeNewWorld", async () => {
    const registryPda = FindWorldRegistryPda(worldProgram.programId);

    const worldPda = FindWorldPda(new BN(0), worldProgram.programId);
    await worldProgram.methods
      .initializeNewWorld()
      .accounts({
        world: worldPda,
        registry: registryPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("InitializeNewWorld 2", async () => {
    const registryPda = FindWorldRegistryPda(worldProgram.programId);

    const worldPda = FindWorldPda(new BN(1), worldProgram.programId);
    await worldProgram.methods
      .initializeNewWorld()
      .accounts({
        world: worldPda,
        registry: registryPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Add entity 1", async () => {
    const worldPda = FindWorldPda(new BN(0), worldProgram.programId);
    entity1 = FindEntityPda(new BN(0), new BN(0), null, worldProgram.programId);
    await worldProgram.methods
      .addEntity(null)
      .accounts({
        world: worldPda,
        entity: entity1,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Add entity 2", async () => {
    const worldPda = FindWorldPda(new BN(0), worldProgram.programId);

    entity2 = FindEntityPda(new BN(0), new BN(1), null, worldProgram.programId);
    await worldProgram.methods
      .addEntity(null)
      .accounts({
        world: worldPda,
        entity: entity2,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Add entity 3", async () => {
    const worldPda = FindWorldPda(new BN(0), worldProgram.programId);

    const entityPda = FindEntityPda(
      new BN(0),
      new BN(2),
      null,
      worldProgram.programId
    );
    await worldProgram.methods
      .addEntity(null)
      .accounts({
        world: worldPda,
        entity: entityPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Add entity 4 with extra seeds", async () => {
    const worldPda = FindWorldPda(new BN(0), worldProgram.programId);
    const seed = "extra-seed";
    let entity3 = FindEntityPda(
      new BN(0),
      new BN(3),
      seed,
      worldProgram.programId
    );

    await worldProgram.methods
      .addEntity(seed)
      .accounts({
        world: worldPda,
        entity: entity3,
        payer: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("Initialize Original Component on Entity 1, trough the world instance", async () => {
    let componentEntity1 = FindComponentPda(
      boltComponentProgramOrigin.programId,
      entity1,
      "origin-component"
    );
    await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        data: componentEntity1,
        componentProgram: boltComponentProgramOrigin.programId,
        entity: entity1,
      })
      .rpc();
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    let componentEntity2 = FindComponentPda(
      boltComponentProgramOrigin.programId,
      entity2,
      "origin-component"
    );
    await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        data: componentEntity2,
        componentProgram: boltComponentProgramOrigin.programId,
        entity: entity2,
      })
      .rpc();
  });

  it("Initialize Position Component on Entity 1", async () => {
    componentPositionEntity1 = FindComponentPda(
      boltComponentPositionProgram.programId,
      entity1
    );

    console.log("Component Position E1: ", componentPositionEntity1.toBase58());

    await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        data: componentPositionEntity1,
        componentProgram: boltComponentPositionProgram.programId,
        entity: entity1,
      })
      .rpc();
  });

  it("Initialize Velocity Component on Entity 1", async () => {
    componentVelocityEntity1 = FindComponentPda(
      boltComponentVelocityProgram.programId,
      entity1,
      "component-velocity"
    );

    await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        data: componentVelocityEntity1,
        componentProgram: boltComponentVelocityProgram.programId,
        entity: entity1,
      })
      .rpc();
  });

  it("Initialize Position Component on Entity 2", async () => {
    componentPositionEntity2 = FindComponentPda(
      boltComponentPositionProgram.programId,
      entity2
    );

    await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        data: componentPositionEntity2,
        componentProgram: boltComponentPositionProgram.programId,
        entity: entity2,
      })
      .rpc();
  });

  it("Check Position on Entity 1 is default", async () => {
    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).x.toNumber()
    ).to.equal(0);
    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).y.toNumber()
    ).to.equal(0);
    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).z.toNumber()
    ).to.equal(0);
  });

  it("Simple Movement System and Up direction on Entity 1", async () => {
    const args = {
      direction: Direction.Up,
    };
    await worldProgram.methods
      .apply(serializeArgs(args)) // Move Up
      .accounts({
        componentProgram: boltComponentPositionProgram.programId,
        boltSystem: systemSimpleMovement,
        boltComponent: componentPositionEntity1,
      })
      .rpc({ skipPreflight: true });

    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).y.toNumber()
    ).to.equal(1);

    const componentData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity1
      );
    const x = componentData.x.toNumber();
    const y = componentData.y.toNumber();
    const z = componentData.z.toNumber();
    console.log("+-----------------------------+");
    console.log("| Movement System:   Entity 1 |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");
  });

  it("Simple Movement System and Right direction on Entity 1", async () => {
    const args = {
      direction: Direction.Right,
    };
    await worldProgram.methods
      .apply(serializeArgs(args)) // Move Right
      .accounts({
        componentProgram: boltComponentPositionProgram.programId,
        boltSystem: systemSimpleMovement,
        boltComponent: componentPositionEntity1,
      })
      .rpc({ skipPreflight: true });

    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).y.toNumber()
    ).to.equal(1);
    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).y.toNumber()
    ).to.equal(1);

    const componentData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity1
      );
    const x = componentData.x.toNumber();
    const y = componentData.y.toNumber();
    const z = componentData.z.toNumber();
    console.log("+-----------------------------+");
    console.log("| Movement System:   Entity 1 |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");
  });

  it("Fly System on Entity 1", async () => {
    await worldProgram.methods
      .apply(Buffer.alloc(0)) // Move Up
      .accounts({
        componentProgram: boltComponentPositionProgram.programId,
        boltSystem: systemFly,
        boltComponent: componentPositionEntity1,
      })
      .rpc();

    expect(
      (
        await boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )
      ).z.toNumber()
    ).to.equal(1);

    const componentData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity1
      );
    const x = componentData.x.toNumber();
    const y = componentData.y.toNumber();
    const z = componentData.z.toNumber();
    console.log("+-----------------------------+");
    console.log("| Fly: Position Entity 1      |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");
  });

  it("Apply Velocity on Entity 1", async () => {
    await worldProgram.methods
      .apply2(Buffer.alloc(0))
      .accounts({
        componentProgram1: boltComponentVelocityProgram.programId,
        componentProgram2: boltComponentPositionProgram.programId,
        boltSystem: applyVelocity,
        boltComponent1: componentVelocityEntity1,
        boltComponent2: componentPositionEntity1,
      })
      .remainingAccounts([
        {
          pubkey: componentPositionEntity1,
          isWritable: false,
          isSigner: false,
        },
      ])
      .rpc();

    console.log("Component Velocity: ", componentVelocityEntity1.toBase58());

    let componentData =
      await boltComponentVelocityProgram.account.velocity.fetch(
        componentVelocityEntity1
      );
    let x = componentData.x.toNumber();
    let y = componentData.y.toNumber();
    let z = componentData.z.toNumber();
    const tmp = componentData.lastApplied.toNumber();
    console.log("+-----------------------------+");
    console.log("| Apply Velocity: Velocity Entity 1      |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Timestamp    | ${String(tmp).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");

    let positionData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity1
      );
    x = positionData.x.toNumber();
    y = positionData.y.toNumber();
    z = positionData.z.toNumber();
    console.log("+-----------------------------+");
    console.log("| Apply Velocity: Position Entity 1      |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");
  });
});
