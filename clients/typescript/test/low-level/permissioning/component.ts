import { Keypair } from "@solana/web3.js";
import {
  anchor,
  FindEntityPda,
  FindComponentPda,
  SerializeArgs,
  FindBufferPda,
  FindCpiAuthPda,
} from "../../../lib";
import { assert, expect } from "chai";

export function component(framework) {
  let entity: anchor.web3.PublicKey;
  let component: anchor.web3.PublicKey;

  describe("Component authority", () => {
    it("Add entity 5", async () => {
      const world = await framework.worldProgram.account.world.fetch(
        framework.worldPda,
      );
      entity = FindEntityPda({
        worldId: world.id,
        entityId: world.entities,
      });
      const instruction = await framework.worldProgram.methods
        .addEntity(null)
        .accounts({
          payer: framework.provider.wallet.publicKey,
          world: framework.worldPda,
          entity: entity,
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction);
    });

    it("Initialize position component with authority on authority test entity", async () => {
      const componentId = framework.exampleComponentPosition.programId;
      component = FindComponentPda({
        componentId,
        entity: entity,
      });
      const instruction = await framework.worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: framework.provider.wallet.publicKey,
          entity: entity,
          data: component,
          componentProgram: componentId,
          authority: framework.provider.wallet.publicKey,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction);
    });

    it("Shouldn't apply fly system on authority test entity with wrong authority", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      const keypair = Keypair.generate();

      const instruction = await framework.worldProgram.methods
        .apply(SerializeArgs())
        .accounts({
          buffer: FindBufferPda(component),
          authority: keypair.publicKey,
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
            pubkey: component,
            isSigner: false,
            isWritable: true,
          },
        ])
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);

      try {
        await framework.provider.sendAndConfirm(transaction, [keypair]);
        assert.fail(
          "Shouldn't apply fly system on authority test entity with wrong authority",
        );
      } catch (error) {
        expect(error.logs.join("\n")).to.contain(
          "Error Code: InvalidAuthority",
        );
      }

      const positionAfter =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
      expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
      expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
    });

    it("Apply Fly System on authority test entity should succeed with correct authority", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      const instruction = await framework.worldProgram.methods
        .apply(SerializeArgs())
        .accounts({
          buffer: FindBufferPda(component),
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
            pubkey: component,
            isSigner: false,
            isWritable: true,
          },
        ])
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);

      await framework.provider.sendAndConfirm(transaction);
      const positionAfter =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      expect(positionAfter.x.toNumber()).to.equal(positionBefore.x.toNumber());
      expect(positionAfter.y.toNumber()).to.equal(positionBefore.y.toNumber());
      expect(positionAfter.z.toNumber()).to.equal(
        positionBefore.z.toNumber() + 1,
      );
    });
  });
}
