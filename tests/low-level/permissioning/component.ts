import { Keypair } from "@solana/web3.js";
import { anchor, FindEntityPda, FindComponentPda, SerializeArgs } from "../../../clients/bolt-sdk/lib";
import { expect } from "chai";

export function component(framework) {
    describe("Component authority", () => {
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
    
        it("Apply Fly System on Entity 5 should succeed with correct authority", async () => {
            const positionBefore =
              await framework.exampleComponentPosition.account.position.fetch(
                framework.componentPositionEntity5Pda,
              );
        
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
                  pubkey: framework.componentPositionEntity5Pda,
                  isSigner: false,
                  isWritable: true,
                },
              ])
              .instruction();
            const transaction = new anchor.web3.Transaction().add(instruction);
        
            await framework.provider.sendAndConfirm(transaction);
            const positionAfter =
              await framework.exampleComponentPosition.account.position.fetch(
                framework.componentPositionEntity5Pda,
              );
        
            expect(positionAfter.x.toNumber()).to.equal(positionBefore.x.toNumber());
            expect(positionAfter.y.toNumber()).to.equal(positionBefore.y.toNumber());
            expect(positionAfter.z.toNumber()).to.equal(positionBefore.z.toNumber() + 1);
        });      
    });
}