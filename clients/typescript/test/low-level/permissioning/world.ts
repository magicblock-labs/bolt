import { expect } from "chai";
import {
  anchor,
  FindBufferPda,
  FindCpiAuthPda,
  SerializeArgs,
} from "../../../lib";

export function world(framework) {
  describe("World authority", () => {
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

    it("Whitelist Fly System", async () => {
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

    it("Whitelist Apply Velocity System system", async () => {
      const instruction = await framework.worldProgram.methods
        .approveSystem()
        .accounts({
          authority: framework.provider.wallet.publicKey,
          system: framework.systemApplyVelocity.programId,
          world: framework.worldPda,
        })
        .instruction();
      let transaction = new anchor.web3.Transaction().add(instruction);
      let signature = await framework.provider.sendAndConfirm(transaction, [], {
        skipPreflight: true,
      });

      let transactionResponse =
        await framework.provider.connection.getTransaction(signature, {
          commitment: "confirmed",
        });
      console.log(transactionResponse.meta?.logMessages); // Reference CU is 29222

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
          buffer: FindBufferPda(framework.provider.wallet.publicKey),
          authority: framework.provider.wallet.publicKey,
          boltSystem: framework.systemFly.programId,
          world: framework.worldPda,
          cpiAuth: FindCpiAuthPda(),
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

    it("Remove Fly System", async () => {
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
          buffer: FindBufferPda(framework.provider.wallet.publicKey),
          authority: framework.provider.wallet.publicKey,
          boltSystem: framework.systemFly.programId,
          world: framework.worldPda,
          cpiAuth: FindCpiAuthPda(),
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
        expect(error.logs.join(" ")).to.contain(
          "Error Code: SystemNotApproved",
        );
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
            data: framework.componentPositionEntity1Pda,
            entity: framework.entity1Pda,
            authority: framework.provider.wallet.publicKey,
          })
          .rpc();
      } catch (error) {
        expect(error.message).to.contain("Error Code: InvalidCaller");
        invalid = true;
      }
      expect(invalid).to.equal(true);
    });
  });
}
