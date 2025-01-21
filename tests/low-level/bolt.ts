import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import BN from "bn.js";
import {
  DELEGATION_PROGRAM_ID,
  DelegateComponent,
  anchor,
  web3,
  FindRegistryPda,
  FindWorldPda,
  FindEntityPda,
  FindComponentPda,
  SerializeArgs,
  SessionProgram,
} from "../../clients/bolt-sdk/lib";
import { Direction } from "../utils";

import { Framework } from "../main";

describe("Low level API", () => {
  let framework: Framework;

  let sessionSigner: anchor.web3.Keypair;
  let sessionToken: anchor.web3.PublicKey;

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

  it("Initialize framework", async () => {
    framework = new Framework();
    await framework.initialize();
  });

  it("Initialize registry", async () => {
    const registryPda = FindRegistryPda({});
    const instruction = await framework.worldProgram.methods
      .initializeRegistry()
      .accounts({
        registry: registryPda,
        payer: framework.provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize world", async () => {
    const registryPda = FindRegistryPda({});
    const registry = await framework.worldProgram.account.registry.fetch(registryPda);
    worldId = new BN(registry.worlds);
    worldPda = FindWorldPda({ worldId });
    const instruction = await framework.worldProgram.methods
      .initializeNewWorld()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        registry: registryPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add authority", async () => {
    const instruction = await framework.worldProgram.methods
      .addAuthority(worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        newAuthority: framework.provider.wallet.publicKey,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], { skipPreflight: true });
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(framework.provider.wallet.publicKey),
      ),
    );
  });

  it("Add a second authority", async () => {
    const instruction = await framework.worldProgram.methods
      .addAuthority(worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        newAuthority: secondAuthority,
        world: worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("Remove an authority", async () => {
    const instruction = await framework.worldProgram.methods
      .removeAuthority(worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        authorityToDelete: secondAuthority,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(
      !worldAccount.authorities.some((auth) => auth.equals(secondAuthority)),
    );
  });

  it("InitializeNewWorld 2", async () => {
    const registryPda = FindRegistryPda({});
    const registry = await framework.worldProgram.account.registry.fetch(registryPda);
    const worldId = new BN(registry.worlds);
    const worldPda = FindWorldPda({ worldId });
    const instruction = await framework.worldProgram.methods
      .initializeNewWorld()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        registry: registryPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 1", async () => {
    const world = await framework.worldProgram.account.world.fetch(worldPda);
    entity1Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        entity: entity1Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 2", async () => {
    const world = await framework.worldProgram.account.world.fetch(worldPda);
    entity2Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        entity: entity2Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 3", async () => {
    const world = await framework.worldProgram.account.world.fetch(worldPda);
    const entity3Pda = FindEntityPda({
      worldId: world.id,
      entityId: world.entities,
    });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        entity: entity3Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 4 (with seed)", async () => {
    const world = await framework.worldProgram.account.world.fetch(worldPda);
    const seed = Buffer.from("custom-seed");
    entity4Pda = FindEntityPda({ worldId: world.id, seed });
    const instruction = await framework.worldProgram.methods
      .addEntity(seed)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        entity: entity4Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Add entity 5", async () => {
    const world = await framework.worldProgram.account.world.fetch(worldPda);
    entity5Pda = FindEntityPda({ worldId: world.id, entityId: world.entities });
    const instruction = await framework.worldProgram.methods
      .addEntity(null)
      .accounts({
        payer: framework.provider.wallet.publicKey,
        world: worldPda,
        entity: entity5Pda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Component on Entity 1, through the world instance", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    const componentPda = FindComponentPda({
      componentId,
      entity: entity1Pda
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity1Pda,
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
      entity: entity2Pda
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity2Pda,
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
    componentPositionEntity1Pda = FindComponentPda({
      componentId,
      entity: entity1Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity1Pda,
        data: componentPositionEntity1Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
    const componentId = framework.exampleComponentVelocity.programId;
    componentVelocityEntity1Pda = FindComponentPda({
      componentId,
      entity: entity1Pda,
      seed: "component-velocity",
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity1Pda,
        data: componentVelocityEntity1Pda,
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
      entity: entity2Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity2Pda,
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
    componentPositionEntity4Pda = FindComponentPda({
      componentId,
      entity: entity4Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity4Pda,
        data: componentPositionEntity4Pda,
        componentProgram: componentId,
        authority: framework.worldProgram.programId,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize Position Component on Entity 5 (with authority)", async () => {
    const componentId = framework.exampleComponentPosition.programId;
    componentPositionEntity5Pda = FindComponentPda({
      componentId,
      entity: entity5Pda,
    });
    const instruction = await framework.worldProgram.methods
      .initializeComponent()
      .accounts({
        payer: framework.provider.wallet.publicKey,
        entity: entity5Pda,
        data: componentPositionEntity5Pda,
        componentProgram: componentId,
        authority: framework.provider.wallet.publicKey,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
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
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Up }))
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemSimpleMovement.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
    );
    expect(position.x.toNumber()).to.equal(0);
    expect(position.y.toNumber()).to.equal(1);
    expect(position.z.toNumber()).to.equal(0);
  });


  it("Create Session", async () => {
    sessionSigner = anchor.web3.Keypair.generate();

    const airdrop = await framework.provider.connection.requestAirdrop(
        sessionSigner.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
    );
  
    await framework.provider.connection.confirmTransaction(airdrop, "confirmed");

    const keys = await SessionProgram.methods
      .createSession(true, null)
      .accounts({
          sessionSigner: sessionSigner.publicKey,
          authority: framework.provider.wallet.publicKey,
          targetProgram: framework.exampleComponentPosition.programId
      })
      .signers([sessionSigner])
      .rpcAndKeys();
    sessionToken = keys.pubkeys.sessionToken as anchor.web3.PublicKey;
  });

  it("Apply Simple Movement System (Right) on Entity 1 with session token", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs({ direction: Direction.Right }))
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemSimpleMovement.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
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
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
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
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentVelocity.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentVelocityEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

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
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemApplyVelocity.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentVelocity.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentVelocityEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
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

    const position = await framework.exampleComponentPosition.account.position.fetch(
      componentPositionEntity1Pda,
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
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity4Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);

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

    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: keypair.publicKey,
        boltSystem: framework.systemFly.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity5Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    transaction.recentBlockhash = (await framework.provider.connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = framework.provider.wallet.publicKey;
    transaction.sign(keypair);

    let failed = false;
    try {
      await framework.provider.sendAndConfirm(transaction);
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
    const instruction = await framework.worldProgram.methods
      .approveSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemFly.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Whitelist System 2", async () => {
    const instruction = await framework.worldProgram.methods
      .approveSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemApplyVelocity.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Fly System on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemFly.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Remove System 1", async () => {
    const instruction = await framework.worldProgram.methods
      .removeSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemFly.programId,
        world: worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(worldPda);
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply Invalid Fly System on Entity 1", async () => {
    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: framework.provider.wallet.publicKey,
        boltSystem: framework.systemFly.programId,
        world: worldPda,
        sessionToken: null
      })
      .remainingAccounts([
        {
          pubkey: framework.exampleComponentPosition.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: componentPositionEntity1Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    let invalid = false;
    try {
      await framework.provider.sendAndConfirm(transaction);
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
      expect(error.message).to.contain(
        "Error Code: InvalidCaller",
      );
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
    const instruction = delegateComponent.transaction;
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
      commitment: "confirmed",
    });
    const acc = await framework.provider.connection.getAccountInfo(
      delegateComponent.componentPda,
    );
    expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
  });
});
