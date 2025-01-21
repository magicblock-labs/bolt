import { Keypair, type PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import {
  AddEntity,
  DELEGATION_PROGRAM_ID,
  InitializeRegistry,
  InitializeComponent,
  InitializeNewWorld,
  ApplySystem,
  DelegateComponent,
  AddAuthority,
  RemoveAuthority,
  ApproveSystem,
  RemoveSystem,
  web3,
} from "../../clients/bolt-sdk/lib";
import { Direction } from "../utils";
import { Framework } from "../main";

describe("Intermediate level API", () => {
  let framework: Framework;

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

  it("Initialize framework", async () => {
    framework = new Framework();
    await framework.initialize();
  });

  it("Initialize registry", async () => {
    const initializeRegistry = await InitializeRegistry({
      payer: framework.provider.wallet.publicKey,
      connection: framework.provider.connection,
    });
    try {
      await framework.provider.sendAndConfirm(initializeRegistry.transaction);
    } catch (error) {
      // This is expected to fail because the registry already exists if another api level test ran before
    }
  });

  it("Initialize world", async () => {
    const initializeNewWorld = await InitializeNewWorld({
      payer: framework.provider.wallet.publicKey,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(initializeNewWorld.transaction);
    worldPda = initializeNewWorld.worldPda; // Saved for later
  });

  it("Add authority", async () => {
    const addAuthority = await AddAuthority({
      authority: framework.provider.wallet.publicKey,
      newAuthority: framework.provider.wallet.publicKey,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addAuthority.transaction, [], {
      skipPreflight: true,
    });
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(framework.provider.wallet.publicKey),
      ),
    );
  });

  it("Add a second authority", async () => {
    const addAuthority = await AddAuthority({
      authority: framework.provider.wallet.publicKey,
      newAuthority: secondAuthority,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addAuthority.transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("Remove an authority", async () => {
    const addAuthority = await RemoveAuthority({
      authority: framework.provider.wallet.publicKey,
      authorityToDelete: secondAuthority,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addAuthority.transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      !worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("InitializeNewWorld 2", async () => {
    const initializeNewWorld = await InitializeNewWorld({
      payer: framework.provider.wallet.publicKey,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(initializeNewWorld.transaction);
  });

  it("Add entity 1", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    entity1Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 2", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    entity2Pda = addEntity.entityPda; // Saved for later
  });

  it("Add entity 3", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
  });

  it("Add entity 4 (with seed)", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: worldPda,
      seed: Buffer.from("custom-seed"),
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    entity4Pda = addEntity.entityPda;
  });

  it("Add entity 5", async () => {
    const addEntity = await AddEntity({
      payer: framework.provider.wallet.publicKey,
      world: worldPda,
      connection: framework.provider.connection,
    });
    await framework.provider.sendAndConfirm(addEntity.transaction);
    entity5Pda = addEntity.entityPda; // Saved for later
  });

  it("Initialize Original Component on Entity 1, trough the world instance", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Original Component on Entity 2, trough the world instance", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity2Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 1", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: framework.exampleComponentVelocity.programId,
      seed: "component-velocity",
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    componentVelocityEntity1Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 2", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity2Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
  });

  it("Initialize Position Component on Entity 4", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity4Pda,
      componentId: framework.exampleComponentPosition.programId,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity4Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const initializeComponent = await InitializeComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity5Pda,
      componentId: framework.exampleComponentPosition.programId,
      authority: framework.provider.wallet.publicKey,
    });
    await framework.provider.sendAndConfirm(initializeComponent.transaction);
    componentPositionEntity5Pda = initializeComponent.componentPda; // Saved for later
  });

  it("Check Position on Entity 1 is default", async () => {
    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Up) on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemSimpleMovement.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
      args: {
        direction: Direction.Up,
      },
    });
    await framework.provider.sendAndConfirm(
      applySystem.transaction,
      [],
      { skipPreflight: true },
    );

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Simple Movement System (Right) on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemSimpleMovement.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
      args: {
        direction: Direction.Right,
      },
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.equal(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemApplyVelocity.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
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

    const velocity = await framework.exampleComponentVelocity.account.velocity.fetch(
      componentVelocityEntity1Pda,
    );
    expect(velocity.x.toNumber()).to.equal(10);
    expect(velocity.y.toNumber()).to.equal(0);
    expect(velocity.z.toNumber()).to.equal(0);
    expect(velocity.lastApplied.toNumber()).to.not.equal(0);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply System Velocity on Entity 1, with Clock external account", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemApplyVelocity.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
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

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.greaterThan(1);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(300);
  });

  it("Apply Fly System on Entity 4", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: worldPda,
      entities: [
        {
          entity: entity4Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity4Pda,
    );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(0);
    expect(position.z.toNumber()).to.equal(1);
  });

  it("Apply Fly System on Entity 5 (should fail with wrong authority)", async () => {
    const positionBefore =
      await framework.exampleComponentPosition.account.position.fetch(
        componentPositionEntity5Pda,
      );

    let keypair = Keypair.generate();

    const applySystem = await ApplySystem({
      authority: keypair.publicKey,
      systemId: framework.systemFly.programId,
      world: worldPda,
      entities: [
        {
          entity: entity5Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
    });
    applySystem.transaction.recentBlockhash = (await framework.provider.connection.getLatestBlockhash()).blockhash;
    applySystem.transaction.feePayer = framework.provider.wallet.publicKey;
    applySystem.transaction.sign(keypair);

    let failed = false;
    try {
      await framework.provider.sendAndConfirm(applySystem.transaction);
    } catch (error) {
      failed = true;
      expect(error.logs.join("\n")).to.contain("Error Code: InvalidAuthority");
    }
    expect(failed).to.equal(true);

    const positionAfter = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity5Pda,
    );

    expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
    expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
    expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
  });

  it("Whitelist System", async () => {
    const approveSystem = await ApproveSystem({
      authority: framework.provider.wallet.publicKey,
      systemToApprove: framework.systemFly.programId,
      world: worldPda,
    });

    await framework.provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true },
    );

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Whitelist System 2", async () => {
    const approveSystem = await ApproveSystem({
      authority: framework.provider.wallet.publicKey,
      systemToApprove: framework.systemApplyVelocity.programId,
      world: worldPda,
    });

    await framework.provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true },
    );

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
    });
    await framework.provider.sendAndConfirm(applySystem.transaction);
  });

  it("Remove System 1", async () => {
    const approveSystem = await RemoveSystem({
      authority: framework.provider.wallet.publicKey,
      systemToRemove: framework.systemFly.programId,
      world: worldPda,
    });

    await framework.provider.sendAndConfirm(
      approveSystem.transaction,
      [],
      { skipPreflight: true },
    );

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Invalid Fly System on Entity 1", async () => {
    const applySystem = await ApplySystem({
      authority: framework.provider.wallet.publicKey,
      systemId: framework.systemFly.programId,
      world: worldPda,
      entities: [
        {
          entity: entity1Pda,
          components: [{ componentId: framework.exampleComponentPosition.programId }],
        },
      ],
    });
    let invalid = false;
    try {
      await framework.provider.sendAndConfirm(applySystem.transaction);
    } catch (error) {
      expect(error.logs.join(" ")).to.contain("Error Code: SystemNotApproved");
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check invalid component init without CPI", async () => {
    let invalid = false;
    try {
      await framework.exampleComponentPosition.methods
        .initialize()
        .accounts({
          payer: framework.provider.wallet.publicKey,
          data: componentPositionEntity5Pda,
          entity: entity5Pda,
          authority: framework.provider.wallet.publicKey,
        })
        .rpc();
    } catch (error) {
      expect(error.message).to.contain("Error Code: InvalidCaller");
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check invalid component update without CPI", async () => {
    let invalid = false;
    try {
      await framework.exampleComponentPosition.methods
        .update(Buffer.from(""))
        .accounts({
          boltComponent: componentPositionEntity4Pda,
          authority: framework.provider.wallet.publicKey,
          sessionToken: null
        })
        .rpc();
    } catch (error) {
      expect(error.message).to.contain("Error Code: InvalidCaller");
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });

  it("Check component delegation", async () => {
    const delegateComponent = await DelegateComponent({
      payer: framework.provider.wallet.publicKey,
      entity: entity1Pda,
      componentId: framework.exampleComponentPosition.programId,
    });

    await framework.provider.sendAndConfirm(
      delegateComponent.transaction,
      [],
      { skipPreflight: true, commitment: "confirmed" },
    );
    const acc = await framework.provider.connection.getAccountInfo(
      delegateComponent.componentPda,
    );
    expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
  });
});
