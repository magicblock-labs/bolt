import { expect } from "chai";
import { anchor, SerializeArgs } from "../../clients/bolt-sdk/lib";
import { Keypair } from "@solana/web3.js";

export function permissioning(framework) {
  it("Apply Fly System on Entity 5 (should fail with wrong authority)", async () => {
    const positionBefore =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity5Pda,
      );

    let keypair = Keypair.generate();

    const instruction = await framework.worldProgram.methods
      .apply(SerializeArgs())
      .accounts({
        authority: keypair.publicKey,
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
          pubkey: framework.componentPositionEntity5Pda,
          isSigner: false,
          isWritable: true,
        },
      ])
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    transaction.recentBlockhash = (
      await framework.provider.connection.getLatestBlockhash()
    ).blockhash;
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

    const positionAfter =
      await framework.exampleComponentPosition.account.position.fetch(
        framework.componentPositionEntity5Pda,
      );

    expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
    expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
    expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
  });

  it("Add authority", async () => {
    const instruction = await framework.worldProgram.methods
      .addAuthority(framework.worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        newAuthority: framework.provider.wallet.publicKey,
        world: framework.worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(framework.provider.wallet.publicKey),
      ),
    );
  });

  it("Add a second authority", async () => {
    const instruction = await framework.worldProgram.methods
      .addAuthority(framework.worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        newAuthority: framework.secondAuthority,
        world: framework.worldPda,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(
      worldAccount.authorities.some((auth) =>
        auth.equals(framework.secondAuthority),
      ),
    );
  });

  it("Remove an authority", async () => {
    const instruction = await framework.worldProgram.methods
      .removeAuthority(framework.worldId)
      .accounts({
        authority: framework.provider.wallet.publicKey,
        authorityToDelete: framework.secondAuthority,
        world: framework.worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction);
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(
      !worldAccount.authorities.some((auth) =>
        auth.equals(framework.secondAuthority),
      ),
    );
  });

  it("Whitelist System", async () => {
    const instruction = await framework.worldProgram.methods
      .approveSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemFly.programId,
        world: framework.worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Whitelist System 2", async () => {
    const instruction = await framework.worldProgram.methods
      .approveSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemApplyVelocity.programId,
        world: framework.worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
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
  });

  it("Remove System 1", async () => {
    const instruction = await framework.worldProgram.methods
      .removeSystem()
      .accounts({
        authority: framework.provider.wallet.publicKey,
        system: framework.systemFly.programId,
        world: framework.worldPda,
      })
      .instruction();
    const transaction = new anchor.web3.Transaction().add(instruction);
    await framework.provider.sendAndConfirm(transaction, [], {
      skipPreflight: true,
    });

    // Get World and check permissionless and systems
    const worldAccount = await framework.worldProgram.account.world.fetch(
      framework.worldPda,
    );
    expect(worldAccount.permissionless).to.equal(false);
    expect(worldAccount.systems.length).to.be.greaterThan(0);
  });

  it("Apply unauthorized Fly System on Entity 1", async () => {
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
          data: framework.componentPositionEntity5Pda,
          entity: framework.entity5Pda,
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
          boltComponent: framework.componentPositionEntity4Pda,
          authority: framework.provider.wallet.publicKey,
          sessionToken: null,
        })
        .rpc();
    } catch (error) {
      expect(error.message).to.contain("Error Code: InvalidCaller");
      invalid = true;
    }
    expect(invalid).to.equal(true);
  });
}
