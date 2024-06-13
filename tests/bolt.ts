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
  const applyVelocity = (
    anchor.workspace.SystemApplyVelocity as Program<SystemApplyVelocity>
  ).programId;

  let worldPda: PublicKey;
  let entity1Pda: PublicKey;
  let entity2Pda: PublicKey;
  let entity5Pda: PublicKey;
  let componentPositionEntity1Pda: PublicKey;
  let componentPositionEntity2Pda: PublicKey;
  let componentPositionEntity5Pda: PublicKey;
  let componentVelocityEntity1: PublicKey;

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
    const args = {
      direction: Direction.Up,
    };
    await worldProgram.methods
      .apply(serializeArgs(args)) // Move Up
      .accounts({
        componentProgram: boltComponentPositionProgram.programId,
        boltSystem: systemSimpleMovement,
        boltComponent: componentPositionEntity1,
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        authority: provider.wallet.publicKey,
      })
      .rpc();

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
    console.log("Component Position: ", componentPositionEntity1.toString());
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
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        authority: provider.wallet.publicKey,
      })
      .rpc();

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
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        authority: provider.wallet.publicKey,
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
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const componentData =
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

    const positionData =
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
    expect(positionData.z.toNumber()).to.not.equal(300);
  });

  it("Apply Velocity on Entity 1, with Clock external account", async () => {
    await worldProgram.methods
      .apply2(Buffer.alloc(0))
      .accounts({
        componentProgram1: boltComponentVelocityProgram.programId,
        componentProgram2: boltComponentPositionProgram.programId,
        boltSystem: applyVelocity,
        boltComponent1: componentVelocityEntity1,
        boltComponent2: componentPositionEntity1,
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        authority: provider.wallet.publicKey,
      })
      .remainingAccounts([
        {
          pubkey: new web3.PublicKey(
            "SysvarC1ock11111111111111111111111111111111"
          ),
          isWritable: false,
          isSigner: false,
        },
      ])
      .rpc();

    const positionData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity1
      );
    // Check if the position has changed to 300 (which means the account clock was used)
    expect(positionData.z.toNumber()).to.equal(300);
  });

  // Check illegal authority usage
  it("Check invalid component update", async () => {
    const componentDataPrev =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity5
      );

    try {
      await worldProgram.methods
        .apply(Buffer.alloc(0)) // Move Up
        .accounts({
          componentProgram: boltComponentPositionProgram.programId,
          boltSystem: systemFly,
          boltComponent: componentPositionEntity5,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e) {
      expect(e.message).to.contain("Invalid authority");
    }

    const componentData =
      await boltComponentPositionProgram.account.position.fetch(
        componentPositionEntity5
      );

    expect(
      componentDataPrev.x.toNumber() === componentData.x.toNumber() &&
        componentDataPrev.y.toNumber() === componentData.y.toNumber() &&
        componentDataPrev.z.toNumber() === componentData.z.toNumber()
    ).to.equal(true);
  });

  // Check illegal call, without CPI
  it("Check invalid init without CPI", async () => {
    let invalid = false;
    const componentVelocityEntity5 = FindComponentPda(
      boltComponentVelocityProgram.programId,
      entity5
    );
    try {
      await boltComponentProgramOrigin.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentVelocityEntity5,
          entity: entity5,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e) {
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  // Check illegal call, without CPI
  it("Check invalid update without CPI", async () => {
    let invalid = false;
    const componentVelocityEntity5 = FindComponentPda(
      boltComponentVelocityProgram.programId,
      entity5
    );
    try {
      await boltComponentProgramOrigin.methods
        .update(null)
        .accounts({
          boltComponent: componentVelocityEntity5,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (e) {
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  // Check component delegation
  it("Check component delegation", async () => {
    const delegateIx = createDelegateInstruction({
      entity: entity1,
      account: componentPositionEntity1,
      ownerProgram: boltComponentPositionProgram.programId,
      payer: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx, [], { skipPreflight: true });
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1
    );
    expect(acc.owner.toString()).to.equal(DELEGATION_PROGRAM_ID);
  });

  // Check component undelegation
  it("Check component undelegation", async () => {
    const delegateIx = createUndelegateInstruction({
      payer: provider.wallet.publicKey,
      delegatedAccount: componentPositionEntity1,
      ownerProgram: boltComponentPositionProgram.programId,
      reimbursement: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx, [], { skipPreflight: true });
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1
    );
    expect(acc.owner).to.deep.equal(boltComponentPositionProgram.programId);
  });
});
