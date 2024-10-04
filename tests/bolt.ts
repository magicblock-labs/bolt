import * as anchor from "@coral-xyz/anchor";
import { type Program, web3 } from "@coral-xyz/anchor";
import { Keypair, type PublicKey } from "@solana/web3.js";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type BoltComponent } from "../target/types/bolt_component";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type World } from "../target/types/world";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { expect } from "chai";
import type BN from "bn.js";
import {
  AddEntity,
  createInitializeRegistryInstruction,
  DELEGATION_PROGRAM_ID,
  FindRegistryPda,
  InitializeComponent,
  InitializeNewWorld,
  ApplySystem,
  DelegateComponent,
  AddAuthority,
  RemoveAuthority,
  ApproveSystem,
  RemoveSystem,
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

  const worldProgram = anchor.workspace.World as Program<World>;

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

  const secondAuthority = Keypair.generate().publicKey;

  it.only("InitializeRegistry", async () => {
    const registryPda = FindRegistryPda({});
    const initializeRegistryIx = createInitializeRegistryInstruction({
      registry: registryPda,
      payer: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction().add(initializeRegistryIx);
    await provider.sendAndConfirm(tx);
  });

  it.only("InitializeNewWorld", async () => {
    const initializeNewWorld = await InitializeNewWorld({
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    });
    const signature = await provider.sendAndConfirm(initializeNewWorld.transaction);
    console.log("InitializeNewWorld signature: ", signature);
    worldPda = initializeNewWorld.worldPda; // Saved for later
  });

  it("Add authority", async () => {
    const addAuthority = await AddAuthority({
      authority: provider.wallet.publicKey,
      newAuthority: provider.wallet.publicKey,
      world: worldPda,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addAuthority.transaction, [], {
      skipPreflight: true,
    });
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(provider.wallet.publicKey)
      )
    );
  });

  it("Add a second authority", async () => {
    const addAuthority = await AddAuthority({
      authority: provider.wallet.publicKey,
      newAuthority: secondAuthority,
      world: worldPda,
      connection: provider.connection,
    });
    const signature = await provider.sendAndConfirm(addAuthority.transaction);
    console.log(`Add Authority signature: ${signature}`);
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) => auth.equals(secondAuthority))
    );
  });

  it("Remove an authority", async () => {
    const addAuthority = await RemoveAuthority({
      authority: provider.wallet.publicKey,
      authorityToDelete: secondAuthority,
      world: worldPda,
      connection: provider.connection,
    });
    const signature = await provider.sendAndConfirm(addAuthority.transaction);
    console.log(`Add Authority signature: ${signature}`);
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      !worldAccount.authorities.some((auth) => auth.equals(secondAuthority))
    );
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
      world: worldPda,
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
    const signature = await provider.sendAndConfirm(
      applySystem.transaction,
      [],
      { skipPreflight: true }
    );
    console.log(`Signature: ${signature}`);

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
      world: worldPda,
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
      world: worldPda,
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
      world: worldPda,
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
      world: worldPda,
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
      world: worldPda,
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
      world: worldPda,
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
      // console.log("error", error);
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

  it("Whitelist System", async () => {
    const approveSystem = await ApproveSystem({
      authority: provider.wallet.publicKey,
      systemToApprove: exampleSystemFly,
      world: worldPda,
    });

    const signature = await provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true }
    );
    console.log(`Whitelist 2 system approval signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Whitelist System 2", async () => {
    const approveSystem = await ApproveSystem({
      authority: provider.wallet.publicKey,
      systemToApprove: exampleSystemApplyVelocity,
      world: worldPda,
    });

    const signature = await provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true }
    );
    console.log(`Whitelist 2 system approval signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemFly,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
    });
    await provider.sendAndConfirm(applySystem.transaction);
  });

  it("Remove System 1", async () => {
    const approveSystem = await RemoveSystem({
      authority: provider.wallet.publicKey,
      systemToRemove: exampleSystemFly,
      world: worldPda,
    });

    const signature = await provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true }
    );
    console.log(`Whitelist 2 system approval signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Invalid Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: provider.wallet.publicKey,
      systemId: exampleSystemFly,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: exampleComponentPosition.programId }],
        },
      ],
    });
    let invalid = false;
    try {
      await provider.sendAndConfirm(applySystem.transaction);
    } catch (error) {
      expect(error.logs.join(" ")).to.contain("Error Code: SystemNotApproved");
      invalid = true;
    }
    expect(invalid).to.equal(true);
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
      // console.log("error", error);
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
      // console.log("error", error);
      expect(error.message).to.contain(
        "bolt_component. Error Code: AccountOwnedByWrongProgram"
      );
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check component delegation", async () => {
    const delegateComponent = await DelegateComponent({
      payer: provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: exampleComponentPosition.programId,
    });

    const txSign = await provider.sendAndConfirm(
      delegateComponent.transaction,
      [],
      { skipPreflight: true, commitment: "confirmed" }
    );
    console.log(`Delegation signature: ${txSign}`);
    const acc = await provider.connection.getAccountInfo(
      delegateComponent.componentPda
    );
    expect(acc.owner.toString()).to.equal(DELEGATION_PROGRAM_ID);
  });
});
