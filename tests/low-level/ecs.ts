import { expect } from "chai";
import {
  anchor,
  web3,
  FindComponentPda,
  FindEntityPda,
  SerializeArgs,
} from "../../clients/bolt-sdk/lib";
import { Direction } from "../framework";

export function ecs(framework) {
  it("Add entity 1", async () => {
    const world = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    framework.entity1Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        entity: framework.entity1Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 2", async () => {
    const world = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    framework.entity2Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        entity: framework.entity2Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 3", async () => {
    const world = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    const entity3Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        entity: entity3Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 4 (with seed)", async () => {
    const world = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    const seed = Buffer.from("custom-seed");
    framework.entity4Pda = FindEntityPda({ worldId: world.id, seed });
    const instruction = await framework.worldProgram.methods
      .addEntity(seed)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        entity: framework.entity4Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 5", async () => {
    const world = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    framework.entity5Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        entity: framework.entity5Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Component on Entity 1, through the world instance", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    const componentPda = FindComponentPda({
      componentId,
      entity: framework.entity1Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        data: componentPda,
        componentProgram: componentId,
        authority: framework.provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Component on Entity 2, trough the world instance", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    const componentPda = FindComponentPda({
      componentId,
      entity: framework.entity2Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity2Pda,
        data: componentPda,
        componentProgram: componentId,
        authority: framework.provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Position Component on Entity 1", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    framework.componentPositionEntity1Pda = FindComponentPda({
      componentId,
      entity: framework.entity1Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        data: framework.componentPositionEntity1Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const componentId = framework.exampleComponentVelocity.programId;
    framework.componentVelocityEntity1Pda = FindComponentPda({
      componentId,
      entity: framework.entity1Pda,
      seed: "component-velocity",
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        data: framework.componentVelocityEntity1Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Position Component on Entity 2", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    const componentPositionEntity2Pda = FindComponentPda({
      componentId,
      entity: framework.entity2Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity2Pda,
        data: componentPositionEntity2Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Position Component on Entity 4", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    framework.componentPositionEntity4Pda = FindComponentPda({
      componentId,
      entity: framework.entity4Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity4Pda,
        data: framework.componentPositionEntity4Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    framework.componentPositionEntity5Pda = FindComponentPda({
      componentId,
      entity: framework.entity5Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity5Pda,
        data: framework.componentPositionEntity5Pda,
        componentProgram: componentId,
        authority: framework.provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Check Position on Entity 1 is default", async () => {
    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Up) on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Up }))
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemSimpleMovement.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Right) on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Right }))
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemSimpleMovement.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemFly.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemApplyVelocity.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentVelocity.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentVelocityEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const velocity =
      await framework.exampleComponentVelocity.account.velocity.fetch(
        framework.componentVelocityEntity1Pda,
      );
    expect(velocity.x.toNumber()).to.equal(10);
    expect(velocity.y.toNumber()).to.equal(0);
    expect(velocity.z.toNumber()).to.equal(0);
    expect(velocity.lastApplied.toNumber()).to.not.equal(0);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1, with Clock external account", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemApplyVelocity.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentVelocity.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentVelocityEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: framework.worldProgram.programId, // world program ID is the end of components delimiter
          isSigner: false,
          isWritable: false,
        },
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
    await framework.provider.sendAndConfirm(transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(300);
  });

  it("Apply Fly System on Entity 4", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemFly.programId,
        world: framework.worldPda,
        sessionToken: null,
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: framework.componentPositionEntity4Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity4Pda,
      );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(1);
  });
}
