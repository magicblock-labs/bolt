import {
  web3,
  AddEntity,
  ApplySystem,
  InitializeComponent,
} from "../../clients/bolt-sdk/lib";
import { Direction, Framework } from "../framework";
import { expect } from "chai";

export function ecs(framework: Framework) {
  it("Add entity 1", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: framework.worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    framework.entity1Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 2", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: framework.worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    framework.entity2Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 3", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: framework.worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
  });

  it("Add entity 4 (with seed)", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: framework.worldPda,
      seed: Buffer.from("custom-seed"),
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    framework.entity4Pda = addEntity.entityPda;
  });

  it("Add entity 5", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: framework.worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    framework.entity5Pda = addEntity.entityPda; // Saved for later
  });

  it("Initialize Original Component on Entity 1, trough the world instance", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity1Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity2Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 1", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity1Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    framework.componentPositionEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity1Pda,
      componentId: framework.exampleComponentVelocity.programId,
      seed: "component-velocity",
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    framework.componentVelocityEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 2", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity2Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 4", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity4Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    framework.componentPositionEntity4Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: framework.entity5Pda,
      componentId: framework.exampleComponentPosition.programId,
      authority: framework.provider.wallet.publicKey,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    framework.componentPositionEntity5Pda = initializeComponent.componentPda; // Saved for later
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
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemSimpleMovement.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity1Pda,
          components: [
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
      args: {
        direction: Direction.Up,
      },
    });
    await framework.provider.sendAndConfirm(applySystem.transaction, [], {
      skipPreflight: true,
    });

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Right) on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemSimpleMovement.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity1Pda,
          components: [
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
      args: {
        direction: Direction.Right,
      },
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity1Pda,
          components: [
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemApplyVelocity.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity1Pda,
          components: [
            {
              componentId: framework.exampleComponentVelocity.programId,
              seed: "component-velocity",
            },
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

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
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemApplyVelocity.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity1Pda,
          components: [
            {
              componentId: framework.exampleComponentVelocity.programId,
              seed: "component-velocity",
            },
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
      extraAccounts: [
        {
          pubkey: new web3.PublicKey(
            "SysvarC1ock11111111111111111111111111111111",
          ),
          isWritable: false,
          isSigner: false,
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(300);
  });

  it("Apply Fly System on Entity 4", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: framework.worldPda,
      entities: [
        {
          entity: framework.entity4Pda,
          components: [
            { componentId: framework.exampleComponentPosition.programId },
          ],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity4Pda,
      );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(1);
  });
}
