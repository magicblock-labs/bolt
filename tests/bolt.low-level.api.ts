import { Keypair, type PublicKey } from "@solana/web3.js";
import { type Position } from "../target/types/position";
import { type Velocity } from "../target/types/velocity";
import { type BoltComponent } from "../target/types/bolt_component";
import { type SystemSimpleMovement } from "../target/types/system_simple_movement";
import { type World } from "../target/types/world";
import { type SystemFly } from "../target/types/system_fly";
import { type SystemApplyVelocity } from "../target/types/system_apply_velocity";
import { expect } from "chai";
import BN from "bn.js";
import {
  DELEGATION_PROGRAM_ID,
  DelegateComponent,
  type Program,
  anchor,
  web3,
  FindRegistryPda,
  FindWorldPda,
  FindEntityPda,
  FindComponentPda,
  SerializeArgs,
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
  let worldId: BN;

  let entity1Pda: PublicKey;
  let entity2Pda: PublicKey;
  let entity4Pda: PublicKey;
  let entity5Pda: PublicKey;

  let componentPositionEntity1Pda: PublicKey;
  let componentVelocityEntity1Pda: PublicKey;

  let componentPositionEntity4Pda: PublicKey;
  let componentPositionEntity5Pda: PublicKey;

  const secondAuthority = Keypair.generate().publicKey;

  it("InitializeRegistry", async () => {
    const registryPda = FindRegistryPda({});
    const instruction = await worldProgram.methods
      .initializeRegistry()
      .accounts({
        registry: registryPda,
        payer: provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await provider.sendAndConfirm(transaction);
  });

  it("InitializeNewWorld", async () => {
    const registryPda = FindRegistryPda({});
    const registry = await worldProgram.account.registry.fetch(registryPda);
    worldId = new BN(registry.worlds);
    worldPda = FindWorldPda({ worldId });
    const instruction = await worldProgram.methods
      .initializeNewWorld()
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        registry: registryPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("InitializeNewWorld signature: ", signature);
  });

  it("Add authority", async () => {
    const instruction = await worldProgram.methods
      .addAuthority(worldId)
      .accounts({
        authority: provider.wallet.publicKey,
        newAuthority: provider.wallet.publicKey,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await provider.sendAndConfirm(transaction, [], { skipPreflight: true });
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(provider.wallet.publicKey),
      ),
    );
  });

  it("Add a second authority", async () => {
    const instruction = await worldProgram.methods
      .addAuthority(worldId)
      .accounts({
        authority: provider.wallet.publicKey,
        newAuthority: secondAuthority,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(`Add Authority signature: ${signature}`);
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("Remove an authority", async () => {
    const instruction = await worldProgram.methods
      .removeAuthority(worldId)
      .accounts({
        authority: provider.wallet.publicKey,
        authorityToDelete: secondAuthority,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(`Remove Authority signature: ${signature}`);
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(
      !worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("InitializeNewWorld 2", async () => {
    const registryPda = FindRegistryPda({});
    const registry = await worldProgram.account.registry.fetch(registryPda);
    const worldId = new BN(registry.worlds);
    const worldPda = FindWorldPda({ worldId });
    const instruction = await worldProgram.methods
      .initializeNewWorld()
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        registry: registryPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("InitializeNewWorld 2 signature: ", signature);
  });

  it("Add entity 1", async () => {
    const world = await worldProgram.account.world.fetch(worldPda);
    entity1Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        entity: entity1Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Add Entity 1 signature: ", signature);
  });

  it("Add entity 2", async () => {
    const world = await worldProgram.account.world.fetch(worldPda);
    entity2Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        entity: entity2Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Add Entity 2 signature: ", signature);
  });

  it("Add entity 3", async () => {
    const world = await worldProgram.account.world.fetch(worldPda);
    const entity3Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        entity: entity3Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Add Entity 3 signature: ", signature);
  });

  it("Add entity 4 (with seed)", async () => {
    const world = await worldProgram.account.world.fetch(worldPda);
    const seed = Buffer.from("custom-seed");
    entity4Pda = FindEntityPda({ worldId: world.id, seed });
    const instruction = await worldProgram.methods
      .addEntity(seed)
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        entity: entity4Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Add Entity 4 signature: ", signature);
  });

  it("Add entity 5", async () => {
    const world = await worldProgram.account.world.fetch(worldPda);
    entity5Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: provider.wallet.publicKey,
        world: worldPda,
        entity: entity5Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Add Entity 5 signature: ", signature);
  });

  it("Initialize Original Component on Entity 1, trough the world instance", async () => {
    const componentId = boltComponentProgram.programId;
    const componentPda = FindComponentPda({
      componentId,
      entity: entity1Pda,
      seed: "origin-component",
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity1Pda,
        data: componentPda,
        componentProgram: componentId,
        authority: provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Original Component on Entity 1 signature: ",
      signature,
    );
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    const componentId = boltComponentProgram.programId;
    const componentPda = FindComponentPda({
      componentId,
      entity: entity2Pda,
      seed: "origin-component",
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity2Pda,
        data: componentPda,
        componentProgram: componentId,
        authority: provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Original Component on Entity 2 signature: ",
      signature,
    );
  });

  it("Initialize Position Component on Entity 1", async () => {
    const componentId = exampleComponentPosition.programId;
    componentPositionEntity1Pda = FindComponentPda({
      componentId,
      entity: entity1Pda,
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity1Pda,
        data: componentPositionEntity1Pda,
        componentProgram: componentId,
        authority: worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Position Component on Entity 1 signature: ",
      signature,
    );
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const componentId = exampleComponentVelocity.programId;
    componentVelocityEntity1Pda = FindComponentPda({
      componentId,
      entity: entity1Pda,
      seed: "component-velocity",
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity1Pda,
        data: componentVelocityEntity1Pda,
        componentProgram: componentId,
        authority: worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Velocity Component on Entity 1 signature: ",
      signature,
    );
  });

  it("Initialize Position Component on Entity 2", async () => {
    const componentId = exampleComponentPosition.programId;
    const componentPositionEntity2Pda = FindComponentPda({
      componentId,
      entity: entity2Pda,
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity2Pda,
        data: componentPositionEntity2Pda,
        componentProgram: componentId,
        authority: worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Position Component on Entity 2 signature: ",
      signature,
    );
  });

  it("Initialize Position Component on Entity 4", async () => {
    const componentId = exampleComponentPosition.programId;
    componentPositionEntity4Pda = FindComponentPda({
      componentId,
      entity: entity4Pda,
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity4Pda,
        data: componentPositionEntity4Pda,
        componentProgram: componentId,
        authority: worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Position Component on Entity 4 signature: ",
      signature,
    );
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const componentId = exampleComponentPosition.programId;
    componentPositionEntity5Pda = FindComponentPda({
      componentId,
      entity: entity5Pda,
    });
    const instruction = await worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: provider.wallet.publicKey,
        entity: entity5Pda,
        data: componentPositionEntity5Pda,
        componentProgram: componentId,
        authority: provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Initialize Position Component on Entity 5 signature: ",
      signature,
    );
  });

  it("Check Position on Entity 1 is default", async () => {
    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Default State: Entity 1", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Up) on Entity 1 using Apply", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Up }))
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemSimpleMovement,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Apply Simple Movement System (Up) on Entity 1 signature: ",
      signature,
    );

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Movement System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Up) on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Up }))
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemSimpleMovement,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Apply Simple Movement System (Up) on Entity 1 signature: ",
      signature,
    );

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Movement System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(2);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Right) on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Right }))
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemSimpleMovement,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log(
      "Apply Simple Movement System (Right) on Entity 1 signature: ",
      signature,
    );

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Movement System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(2);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemFly,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Apply Fly System on Entity 1 signature: ", signature);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Fly System: Entity 1", position);
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(2);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply2(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemApplyVelocity,
        boltComponent1: componentVelocityEntity1Pda,
        componentProgram1: exampleComponentVelocity.programId,
        boltComponent2: componentPositionEntity1Pda,
        componentProgram2: exampleComponentPosition.programId,
        world: worldPda,
      })
      .remainingAccounts([])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);
    console.log("Apply System Velocity on Entity 1 signature: ", signature);

    const velocity = await exampleComponentVelocity.account.velocity.fetch(
      componentVelocityEntity1Pda,
    );
    logVelocity("Apply System Velocity: Entity 1", velocity);
    expect(velocity.x.toNumber()).to.equal(10);
    expect(velocity.y.toNumber()).to.equal(0);
    expect(velocity.z.toNumber()).to.equal(0);
    expect(velocity.lastApplied.toNumber()).to.not.equal(0);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Apply System Velocity: Entity 1", position);
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(2);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1, with Clock external account", async () => {
    const instruction = await worldProgram.methods
      .apply2(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemApplyVelocity,
        boltComponent1: componentVelocityEntity1Pda,
        componentProgram1: exampleComponentVelocity.programId,
        boltComponent2: componentPositionEntity1Pda,
        componentProgram2: exampleComponentPosition.programId,
        world: worldPda,
      })
      .remainingAccounts([
        {
          pubkey: new web3.PublicKey(
            "SysvarC1ock11111111111111111111111111111111",
          ),
          isWritable: false,
          isSigner: false,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await provider.sendAndConfirm(transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    logPosition("Apply System Velocity: Entity 1", position);
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(2);
    expect(position.z.toNumber()).to.equal(300);
  });

  it("Apply Fly System on Entity 4", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemFly,
        boltComponent: componentPositionEntity4Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await provider.sendAndConfirm(transaction);

    const position = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity4Pda,
    );
    logPosition("Fly System: Entity 4", position);
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply Fly System on Entity 5 (should fail with wrong authority)", async () => {
    const positionBefore =
      await exampleComponentPosition.account.position.fetch(
        componentPositionEntity5Pda,
      );

    const instruction = await worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemFly,
        boltComponent: componentPositionEntity5Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);

    let failed = false;
    try {
      await provider.sendAndConfirm(transaction);
    } catch (error) {
      failed = true;
      // console.log("error", error);
      expect(error.logs.join("\n")).to.contain("Error Code: InvalidAuthority");
    }
    expect(failed).to.equal(true);

    const positionAfter = await exampleComponentPosition.account.position.fetch(
      componentPositionEntity5Pda,
    );

    expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
    expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
    expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
  });

  it("Whitelist System", async () => {
    const instruction = await worldProgram.methods
      .approveSystem()
      .accounts({
        authority: provider.wallet.publicKey,
        system: exampleSystemFly,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });
    console.log(`Whitelist 2 system approval signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Whitelist System 2", async () => {
    const instruction = await worldProgram.methods
      .approveSystem()
      .accounts({
        authority: provider.wallet.publicKey,
        system: exampleSystemApplyVelocity,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });
    console.log(`Whitelist 2 system approval signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemFly,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await provider.sendAndConfirm(transaction);
  });

  it("Remove System 1", async () => {
    const instruction = await worldProgram.methods
      .removeSystem()
      .accounts({
        authority: provider.wallet.publicKey,
        system: exampleSystemFly,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });
    console.log(`Remove System 1 signature: ${signature}`);

    // Get World and check permissionless and systems
    const worldAccount = await worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Invalid Fly System on Entity 1", async () => {
    const instruction = await worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: provider.wallet.publicKey,
        boltSystem: exampleSystemFly,
        boltComponent: componentPositionEntity1Pda,
        componentProgram: exampleComponentPosition.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    let invalid = false;
    try {
      await provider.sendAndConfirm(transaction);
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
        "bolt_component. Error Code: AccountOwnedByWrongProgram",
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
      { skipPreflight: true, commitment: "confirmed" },
    );
    console.log(`Delegation signature: ${txSign}`);
    const acc = await provider.connection.getAccountInfo(
      delegateComponent.componentPda,
    );
    expect(acc?.owner.toString()).to.equal(DELEGATION_PROGRAM_ID);
  });
});
