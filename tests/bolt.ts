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
  createUndelegateInstruction,
  createInitializeRegistryInstruction,
  DELEGATION_PROGRAM_ID,
  FindRegistryPda,
  InitializeComponent,
  InitializeNewWorld,
  ApplySystem,
} from "../clients/bolt-sdk";

enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

function padCenter(value: string, width: number) {
  const length = value.length;
  if (width <= length) {
    return value;
  }
  const padding = (width - length) / 2;
  const align = width - padding;
  return value.padStart(align, " ").padEnd(width, " ");
}

function logPosition(title: string, { x, y, z }: { x: BN; y: BN; z: BN }) {
  console.log(" +----------------------------------+");
  console.log(` | ${padCenter(title, 32)} |`);
  console.log(" +-----------------+----------------+");
  console.log(` | X Position      | ${String(x).padEnd(14, " ")} |`);
  console.log(` | Y Position      | ${String(y).padEnd(14, " ")} |`);
  console.log(` | Z Position      | ${String(z).padEnd(14, " ")} |`);
  console.log(" +-----------------+----------------+");
}

function logVelocity(
  title: string,
  { x, y, z, lastApplied }: { x: BN; y: BN; z: BN; lastApplied: BN }
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

describe("bolt", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const boltWorld = anchor.workspace.World as Program<World>;
  const boltComponentProgram = anchor.workspace
    .BoltComponent as Program<BoltComponent>;

  const exampleComponentPosition = anchor.workspace
    .Position as Program<Position>;
  const exampleComponentVelocity = anchor.workspace
    .Velocity as Program<Velocity>;

  const exampleSystemSimpleMovement = (
    anchor.workspace.SystemSimpleMovement as Program<SystemSimpleMovement>
  ).programId;
  const exampleSystemFly = (anchor.workspace.SystemFly as Program<SystemFly>)
    .programId;
  const exampleSystemApplyVelocity = (
    anchor.workspace.SystemApplyVelocity as Program<SystemApplyVelocity>
  ).programId;

  let worldPda: PublicKey;

  let entity1Pda: PublicKey;
  let entity2Pda: PublicKey;
  let entity4Pda: PublicKey;
  let entity5Pda: PublicKey;

  let componentPositionEntity1Pda: PublicKey;
  let componentVelocityEntity1Pda: PublicKey;

  let componentPositionEntity4Pda: PublicKey;
  let componentPositionEntity5Pda: PublicKey;

  it("InitializeRegistry", async () => {
    const registryPda = FindRegistryPda({});
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

  it("Add entity 4 (with seed)", async () => {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world: worldPda,
      seed: "extra-seed",
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
    entity4Pda = addEntity.entityPda;
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
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      seed: "origin-component",
      componentId: boltComponentProgram.programId,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity2Pda,
      seed: "origin-component",
      componentId: boltComponentProgram.programId,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 1", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: exampleComponentPosition.programId,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: exampleComponentVelocity.programId,
      seed: "component-velocity",
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
    componentVelocityEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 2", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity2Pda,
      componentId: exampleComponentPosition.programId,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 4", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity4Pda,
      componentId: exampleComponentPosition.programId,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity4Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: provider.wallet.publicKey,
      entity: entity5Pda,
      componentId: exampleComponentPosition.programId,
      authority: provider.wallet.publicKey,
    });
    await provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity5Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Check Position on Entity 1 is default", async () => {
    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Default State: Entity 1", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Up) on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemSimpleMovement,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
      args: {
        direction: Direction.Up,
      },
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Movement System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Right) on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemSimpleMovement,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
      args: {
        direction: Direction.Right,
      },
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Movement System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemFly,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Fly System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemApplyVelocity,
      entities: [
        {
          entity: entity1Pda,
          components: [
            {
              componentId: exampleComponentVelocity.programId,
              seed: "component-velocity",
            },
            { componentId: exampleComponentPosition.programId },
          ],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const velocity = await exampleComponentVelocity.account.velocity.fetch(
      componentVelocityEntity1Pda
    );
    logVelocity("Apply System Velocity: Entity 1", velocity);
    expect(velocity.x.toNumber()).to.equal(10);
    expect(velocity.y.toNumber()).to.equal(0);
    expect(velocity.z.toNumber()).to.equal(0);
    expect(velocity.lastApplied.toNumber()).to.not.equal(0);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Apply System Velocity: Entity 1", position);
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1, with Clock external account", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemApplyVelocity,
      entities: [
        {
          entity: entity1Pda,
          components: [
            {
              componentId: exampleComponentVelocity.programId,
              seed: "component-velocity",
            },
            { componentId: exampleComponentPosition.programId },
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

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda
    );
    logPosition("Apply System Velocity: Entity 1", position);
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(300);
  });

  it("Apply Fly System on Entity 4", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemFly,
      entities: [
        {
          entity: entity4Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity4Pda
    );
    logPosition("Fly System: Entity 4", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply Fly System on Entity 5 (should fail with wrong authority)", async () => {
    const positionBefore =
      await exampleComponentPosition.account.position.fetch(
        componentPositionEntity5Pda
      );

    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemFly,
      entities: [
        {
          entity: entity5Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
    });

    let failed = false;
    try {
      await provider.sendAndConfirm(applySystem.transaction);
    } catch (error) {
      failed = true;
      //console.log("error", error);
      expect(error.logs.join("\n")).to.contain("Error Code: InvalidAuthority");
    }
    expect(failed).to.equal(true);

    const positionAfter = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity5Pda
    );

    expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
    expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
    expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
  });

  it("Check invalid component init without CPI", async () => {
    let invalid = false;
    try {
      await exampleComponentPosition.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentPositionEntity5Pda,
          entity: entity5Pda,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (error) {
      //console.log("error", error);
      expect(error.message).to.contain("Error Code: InvalidCaller");
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check invalid component update without CPI", async () => {
    let invalid = false;
    try {
      await boltComponentProgram.methods
        .update(Buffer.from(""))
        .accounts({
          boltComponent: componentPositionEntity4Pda,
          authority: provider.wallet.publicKey,
        })
        .rpc();
    } catch (error) {
      //console.log("error", error);
      expect(error.message).to.contain(
        "bolt_component. Error Code: AccountOwnedByWrongProgram"
      );
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check component delegation", async () => {
    const delegateIx = createDelegateInstruction({
      entity: entity1Pda,
      account: componentPositionEntity1Pda,
      ownerProgram: exampleComponentPosition.programId,
      payer: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx);
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1Pda
    );
    expect(acc.owner.toString()).to.equal(DELEGATION_PROGRAM_ID);
  });

  it("Check component undelegation", async () => {
    const delegateIx = createUndelegateInstruction({
      payer: provider.wallet.publicKey,
      delegatedAccount: componentPositionEntity1Pda,
      ownerProgram: exampleComponentPosition.programId,
      reimbursement: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(delegateIx);
    await provider.sendAndConfirm(tx);
    const acc = await provider.connection.getAccountInfo(
      componentPositionEntity1Pda
    );
    expect(acc.owner).to.deep.equal(exampleComponentPosition.programId);
  });
});
