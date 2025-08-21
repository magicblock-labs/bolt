import { expect } from "chai";
import {
  anchor,
  FindComponentPda,
  FindEntityPda,
  SerializeArgs,
  SessionProgram,
  FindSessionTokenPda,
  BN,
  FindBufferPda,
  FindCpiAuthPda,
} from "../../lib";
import { Keypair } from "@solana/web3.js";

export function session(framework) {
  describe("Session", () => {
    const sessionSigner: Keypair = Keypair.generate();
    let sessionToken: anchor.web3.PublicKey;
    let entity: anchor.web3.PublicKey;
    let component: anchor.web3.PublicKey;
    let entityWithAuthority: anchor.web3.PublicKey;
    let componentWithAuthority: anchor.web3.PublicKey;

    it("Create Session", async () => {
      sessionToken = FindSessionTokenPda({
        sessionSigner: sessionSigner.publicKey,
        authority: framework.provider.wallet.publicKey,
      });
      let instruction = await SessionProgram.methods
        .createSession(true, null, new BN(1000000000))
        .accounts({
          sessionSigner: sessionSigner.publicKey,
          authority: framework.provider.wallet.publicKey,
          targetProgram: framework.worldProgram.programId,
          sessionToken,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [sessionSigner]);
    });

    it("Add entity", async () => {
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
          payer: sessionSigner.publicKey,
          entity: entity,
          world: framework.worldPda,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [sessionSigner]);
    });

    it("Initialize position component", async () => {
      const componentId = framework.exampleComponentPosition.programId;
      component = FindComponentPda({
        componentId,
        entity,
      });
      const instruction = await framework.worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: sessionSigner.publicKey,
          entity: entity,
          data: component,
          componentProgram: componentId,
          authority: framework.worldProgram.programId,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [sessionSigner]);
    });

    it("Apply Fly System on component using session token", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      const instruction = await framework.worldProgram.methods
        .applyWithSession(SerializeArgs())
        .accounts({
          buffer: FindBufferPda(sessionSigner.publicKey),
          authority: sessionSigner.publicKey,
          boltSystem: framework.systemFly.programId,
          world: framework.worldPda,
          sessionToken,
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

      let signature = await framework.provider.connection.sendTransaction(
        transaction,
        [sessionSigner],
      );
      await framework.provider.connection.confirmTransaction(signature);
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

    it("Add entity for authority test", async () => {
      const world = await framework.worldProgram.account.world.fetch(
        framework.worldPda,
      );
      entityWithAuthority = FindEntityPda({
        worldId: world.id,
        entityId: world.entities,
      });
      const instruction = await framework.worldProgram.methods
        .addEntity(null)
        .accounts({
          payer: sessionSigner.publicKey,
          world: framework.worldPda,
          entity: entityWithAuthority,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [sessionSigner]);
    });

    it("Initialize position component with authority", async () => {
      const componentId = framework.exampleComponentPosition.programId;
      componentWithAuthority = FindComponentPda({
        componentId,
        entity: entityWithAuthority,
      });
      const instruction = await framework.worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: sessionSigner.publicKey,
          entity: entityWithAuthority,
          data: componentWithAuthority,
          componentProgram: componentId,
          authority: framework.provider.wallet.publicKey,
          cpiAuth: FindCpiAuthPda(),
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [sessionSigner]);
    });

    it("Apply Fly System on component with authority using session token", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          componentWithAuthority,
        );

      const instruction = await framework.worldProgram.methods
        .applyWithSession(SerializeArgs())
        .accounts({
          buffer: FindBufferPda(sessionSigner.publicKey),
          authority: sessionSigner.publicKey,
          boltSystem: framework.systemFly.programId,
          world: framework.worldPda,
          sessionToken,
          cpiAuth: FindCpiAuthPda(),
        })
        .remainingAccounts([
          {
            pubkey: framework.exampleComponentPosition.programId,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: componentWithAuthority,
            isSigner: false,
            isWritable: true,
          },
        ])
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);

      let signature = await framework.provider.connection.sendTransaction(
        transaction,
        [sessionSigner],
      );
      await framework.provider.connection.confirmTransaction(signature);
      const positionAfter =
        await framework.exampleComponentPosition.account.position.fetch(
          componentWithAuthority,
        );

      expect(positionAfter.x.toNumber()).to.equal(positionBefore.x.toNumber());
      expect(positionAfter.y.toNumber()).to.equal(positionBefore.y.toNumber());
      expect(positionAfter.z.toNumber()).to.equal(
        positionBefore.z.toNumber() + 1,
      );
    });
  });
}
