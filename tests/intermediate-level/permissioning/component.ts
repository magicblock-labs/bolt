import { expect } from "chai";
import { AddEntity, ApplySystem, InitializeComponent } from "../../../clients/bolt-sdk/lib";
import { Keypair } from "@solana/web3.js";

export function component(framework) {
    describe("Component authority", () => {
        it("Add entity 5", async () => {
            const addEntity = await AddEntity({
              payer: framework.provider.wallet.publicKey,
              world: framework.worldPda,
              connection: framework.provider.connection,
            });
            await framework.provider.sendAndConfirm(addEntity.transaction);
            framework.entity5Pda = addEntity.entityPda; // Saved for later
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
      
        it("Apply Fly System on Entity 5 (should fail with wrong authority)", async () => {
            const positionBefore =
            await framework.exampleComponentPosition.account.position.fetch(
                framework.componentPositionEntity5Pda,
            );

            let keypair = Keypair.generate();

            const applySystem = await ApplySystem({
            authority: keypair.publicKey,
            systemId: framework.systemFly.programId,
            world: framework.worldPda,
            entities: [
                {
                entity: framework.entity5Pda,
                components: [
                    { componentId: framework.exampleComponentPosition.programId },
                ],
                },
            ],
            });
            applySystem.transaction.recentBlockhash = (
            await framework.provider.connection.getLatestBlockhash()
            ).blockhash;
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

            const applySystem = await ApplySystem({
            authority: framework.provider.wallet.publicKey,
            systemId: framework.systemFly.programId,
            world: framework.worldPda,
            entities: [
                {
                entity: framework.entity5Pda,
                components: [
                    { componentId: framework.exampleComponentPosition.programId },
                ],
                },
            ],
            });

            await framework.provider.sendAndConfirm(applySystem.transaction);

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
