import * as anchor from "@coral-xyz/anchor";
import { type Program, web3 } from "@coral-xyz/anchor";
import { type PublicKey } from "@solana/web3.js";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type BoltComponent } from "../target/types/bolt_component";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { type World } from "../target/types/world";
import { expect } from "chai";
import BN from "bn.js";
import {
  AddEntity,
  createDelegateInstruction,
  createInitializeRegistryInstruction,
  DELEGATION_PROGRAM_ID,
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindWorldRegistryPda,
  InitializeComponent,
  InitializeNewWorld,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "../clients/bolt-sdk";
import { createUndelegateInstruction } from "../clients/bolt-sdk/lib/delegation/undelegate";
import { ApplySystem } from "../clients/bolt-sdk/src";

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
    .Position as Program<Position>;
  const boltComponentVelocityProgram = anchor.workspace
    .Velocity as Program<Velocity>;
  const boltComponentProgramOrigin = anchor.workspace
    .BoltComponent as Program<BoltComponent>;

  const systemSimpleMovement = (
    anchor.workspace.SystemSimpleMovement as Program<SystemSimpleMovement>
  ).programId;
  const systemFly = (anchor.workspace.SystemFly as Program<SystemFly>)
    .programId;
  const systemApplyVelocity = (
    anchor.workspace.SystemApplyVelocity as Program<SystemApplyVelocity>
  ).programId;

  let worldPda: PublicKey;
  let entity1Pda: PublicKey;
  let entity2Pda: PublicKey;
  let entity5Pda: PublicKey;
  let componentPositionEntity1Pda: PublicKey;
  let componentPositionEntity2Pda: PublicKey;
  let componentPositionEntity5Pda: PublicKey;
  let componentVelocityEntity1Pda: PublicKey;

  it("InitializeWorldsRegistry", async () => {
    const registryPda = FindWorldRegistryPda(worldProgram.programId);
    const initializeRegistryIx = createInitializeRegistryInstruction({
      registry: registryPda,
      payer: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(initializeRegistryIx);
    await provider.sendAndConfirm(tx);
  });

  it("InitializeNewWorld", async () => {
    const initializeNewWorld = await InitializeNewWorld({
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(initializeNewWorld.transaction);
    worldPda = initializeNewWorld.worldPda; // Saved for later
  });

  it("InitializeNewWorld 2", async () => {
    const initializeNewWorld = await InitializeNewWorld({
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(initializeNewWorld.transaction);
  });

  it("Add entity 1", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
    entity1Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 2", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
    entity2Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 3", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
  });

  it("Add entity 4 with extra seeds", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      seed: "extra-seed",
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
  });

  it("Add entity 5", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
    entity5Pda = addEntity.entityPda; // Saved for later
  });

  it("Initialize Original Component on Entity 1, trough the world instance", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      seed: "origin-component",
      componentId: boltComponentProgramOrigin.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity2Pda,
      seed: "origin-component",
      componentId: boltComponentProgramOrigin.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 1", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: boltComponentPositionProgram.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
    componentPositionEntity1Pda = inititializeComponent.componentPda; // Saved for later
  });

  it("Initialize Velocity Component on Entity 1", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: boltComponentVelocityProgram.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 2", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity2Pda,
      componentId: boltComponentPositionProgram.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
    componentPositionEntity2Pda = inititializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 5", async () => {
    const inititializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity5Pda,
      componentId: boltComponentPositionProgram.programId,
    });
    await provider.sendAndConfirm(inititializeComponent.transaction);
  });

  it("Check Position on Entity 1 is default", async () => {
    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Simple Movement System and Up direction on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemSimpleMovement,
      entities: [
        {
          entity: entity1Pda,
          components: [{ id: boltComponentPositionProgram.programId }],
        },
      ],
      args: {
        direction: Direction.Up,
      },
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    const x = position.x.toNumber();
    const y = position.y.toNumber();
    const z = position.z.toNumber();
    expect(x).to.equal(0);
    expect(y).to.equal(1);
    expect(z).to.equal(0);

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
    console.log("Component Position: ", componentPositionEntity1Pda.toString());
  });

  it("Simple Movement System and Right direction on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemSimpleMovement,
      entities: [
        {
          entity: entity1Pda,
          components: [{ id: boltComponentPositionProgram.programId }],
        },
      ],
      args: {
        direction: Direction.Right,
      },
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    const x = position.x.toNumber();
    const y = position.y.toNumber();
    const z = position.z.toNumber();
    expect(x).to.equal(1);
    expect(y).to.equal(1);
    expect(z).to.equal(0);

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
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemFly,
      entities: [
        {
          entity: entity1Pda,
          components: [{ id: boltComponentPositionProgram.programId }],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    const x = position.x.toNumber();
    const y = position.y.toNumber();
    const z = position.z.toNumber();
    expect(x).to.equal(1);
    expect(y).to.equal(1);
    expect(z).to.equal(1);

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

  it("Apply System Velocity on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemApplyVelocity,
      entities: [
        {
          entity: entity1Pda,
          components: [
            { id: boltComponentVelocityProgram.programId },
            { id: boltComponentPositionProgram.programId },
          ],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const velocity = await boltComponentVelocityProgram.account.velocity.fetch(
      componentVelocityEntity1Pda
    );
    const vx = velocity.x.toNumber();
    const vy = velocity.y.toNumber();
    const vz = velocity.z.toNumber();
    const ts = velocity.lastApplied.toNumber();
    expect(vx).to.equal(0);
    expect(vy).to.equal(0);
    expect(vz).to.equal(0);
    expect(ts).to.equal(0);

    console.log("+-----------------------------+");
    console.log("| Apply System Velocity: Velocity Entity 1      |");
    console.log("+----------------+------------+");
    console.log("| Coordinate    | Value      |");
    console.log("+----------------+------------+");
    console.log(`| X Position    | ${String(vx).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Y Position    | ${String(vy).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Z Position    | ${String(vz).padEnd(10, " ")} |`);
    console.log("|               |            |");
    console.log(`| Timestamp    | ${String(ts).padEnd(10, " ")} |`);
    console.log("+----------------+------------+");
    console.log("|                             |");
    console.log("+-----------------------------+");

    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    const x = position.x.toNumber();
    const y = position.y.toNumber();
    const z = position.z.toNumber();
    expect(x).to.equal(1);
    expect(y).to.equal(1);
    expect(z).to.equal(1);

    console.log("+-----------------------------+");
    console.log("| Apply System Velocity: Position Entity 1      |");
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

  it("Apply System Velocity on Entity 1, with Clock external account", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemApplyVelocity,
      entities: [
        {
          entity: entity1Pda,
          components: [
            { id: boltComponentVelocityProgram.programId },
            { id: boltComponentPositionProgram.programId },
          ],
        },
      ],
      extraAccounts: [
        {
          pubkey: new web3.PublicKey(
            "SysvarC1ock11111111111111111111111111111111"
          ),
          isWritable: false,
          isSigner: false,
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await boltComponentPositionProgram.account.position.fetch(
      componentPositionEntity1Pda
    );
    const x = position.x.toNumber();
    const y = position.y.toNumber();
    const z = position.z.toNumber();
    expect(x).to.equal(1);
    expect(y).to.equal(1);
    expect(z).to.equal(300);

    console.log("+-----------------------------+");
    console.log("| Apply System Velocity: Position Entity 1      |");
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

  // Check illegal authority usage
  it("Check invalid component update", async () => {
    const positionBefore =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity5Pda
      );

    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: systemFly,
      entities: [
        {
          entity: entity5Pda,
          components: [{ id: boltComponentPositionProgram.programId }],
        },
      ],
    });

    let failed = false;
    try {
      await provider.sendAndConfirm(applySystem.transaction);
    } catch (error) {
      failed = true;
      expect(error.message).to.contain("Invalid authority");
    }
    expect(failed).to.equal(true);

    const positionAfter =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity5Pda
      );

    expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
    expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
    expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
  });

  // Check illegal call, without CPI
  it("Check invalid init without CPI", async () => {
    let invalid = false;
    try {
      await boltComponentPositionProgram.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentPositionEntity5Pda,
          entity: entity5Pda,
          //instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          //systemProgram: anchor.web3.SystemProgram.programId,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e) {
      console.log("ERROR:", e);
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  // Check illegal call, without CPI
  it("Check invalid update without CPI", async () => {
    let invalid = false;
    const componentVelocityEntity5 = FindComponentPda(
      boltComponentVelocityProgram.programId,
      entity5Pda
    );
    try {
      await boltComponentProgramOrigin.methods
        .update(null)
        .accounts({
          boltComponent: componentVelocityEntity5,
          //instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e) {
      console.log("ERROR2:", e);
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  // Check component delegation
  it("Check component delegation", async () => {
    const delegateIx = createDelegateInstruction({
      entity: entity1Pda,
      account: componentPositionEntity1Pda,
      ownerProgram: boltComponentPositionProgram.programId,
      payer: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx, [], { skipPreflight: true });
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1Pda
    );
    expect(acc.owner.toString()).to.equal(DELEGATION_PROGRAM_ID);
  });

  // Check component undelegation
  it("Check component undelegation", async () => {
    const delegateIx = createUndelegateInstruction({
      payer: provider.wallet.publicKey,
      delegatedAccount: componentPositionEntity1Pda,
      ownerProgram: boltComponentPositionProgram.programId,
      reimbursement: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx, [], { skipPreflight: true });
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1Pda
    );
    expect(acc.owner).to.deep.equal(boltComponentPositionProgram.programId);
  });
});
