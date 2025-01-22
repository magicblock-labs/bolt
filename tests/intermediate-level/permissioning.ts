import { expect } from "chai";
import { AddAuthority, RemoveAuthority, ApplySystem, ApproveSystem, RemoveSystem } from "../../clients/bolt-sdk/lib";
import { Keypair } from "@solana/web3.js";

export function permissioning(framework) {
    it("Add authority", async () => {
        const addAuthority = await AddAuthority({
            authority: framework.provider.wallet.publicKey,
            newAuthority: framework.provider.wallet.publicKey,
            world: framework.worldPda,
            connection: framework.provider.connection,
        });
        await framework.provider.sendAndConfirm(addAuthority.transaction, [], {
            skipPreflight: true,
        });
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(
            worldAccount.authorities.some((auth) =>
            auth.equals(framework.provider.wallet.publicKey),
            ),
        );
    });

    it("Add a second authority", async () => {
        const addAuthority = await AddAuthority({
            authority: framework.provider.wallet.publicKey,
            newAuthority: framework.secondAuthority,
            world: framework.worldPda,
            connection: framework.provider.connection,
        });
        await framework.provider.sendAndConfirm(addAuthority.transaction);
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(
            worldAccount.authorities.some((auth) => auth.equals(framework.secondAuthority)),
        );
    });

    it("Remove an authority", async () => {
        const removeAuthority = await RemoveAuthority({
            authority: framework.provider.wallet.publicKey,
            authorityToDelete: framework.secondAuthority,
            world: framework.worldPda,
            connection: framework.provider.connection,
        });
        await framework.provider.sendAndConfirm(removeAuthority.transaction);
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(
            !worldAccount.authorities.some((auth) => auth.equals(framework.secondAuthority)),
        );
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
          framework.componentPositionEntity5Pda,
        );
    
        expect(positionBefore.x.toNumber()).to.equal(positionAfter.x.toNumber());
        expect(positionBefore.y.toNumber()).to.equal(positionAfter.y.toNumber());
        expect(positionBefore.z.toNumber()).to.equal(positionAfter.z.toNumber());
      });
    
    it("Whitelist System", async () => {
        const approveSystem = await ApproveSystem({
          authority: framework.provider.wallet.publicKey,
          systemToApprove: framework.systemFly.programId,
          world: framework.worldPda,
        });
    
        await framework.provider.sendAndConfirm(
          approveSystem.transaction,
          [],
          { skipPreflight: true },
        );
    
        // Get World and check permissionless and systems
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(worldAccount.permissionless).to.equal(false);
        expect(worldAccount.systems.length).to.be.greaterThan(0);
    });

    it("Whitelist System 2", async () => {
        const approveSystem = await ApproveSystem({
          authority: framework.provider.wallet.publicKey,
          systemToApprove: framework.systemApplyVelocity.programId,
          world: framework.worldPda,
        });
    
        await framework.provider.sendAndConfirm(
          approveSystem.transaction,
          [],
          { skipPreflight: true },
        );
    
        // Get World and check permissionless and systems
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(worldAccount.permissionless).to.equal(false);
        expect(worldAccount.systems.length).to.be.greaterThan(0);
    });

    it("Apply Fly System on Entity 1", async () => {
        const applySystem = await ApplySystem({
          authority: framework.provider.wallet.publicKey,
          systemId: framework.systemFly.programId,
          world: framework.worldPda,
          entities: [
            {
              entity: framework.entity1Pda,
              components: [{ componentId: framework.exampleComponentPosition.programId }],
            },
          ],
        });
        await framework.provider.sendAndConfirm(applySystem.transaction);
    });

    it("Remove System 1", async () => {
        const removeSystem = await RemoveSystem({
          authority: framework.provider.wallet.publicKey,
          systemToRemove: framework.systemFly.programId,
          world: framework.worldPda,
        });
    
        await framework.provider.sendAndConfirm(
          removeSystem.transaction,
          [],
          { skipPreflight: true },
        );
    
        // Get World and check permissionless and systems
        const worldAccount = await framework.worldProgram.account.world.fetch(framework.worldPda);
        expect(worldAccount.permissionless).to.equal(false);
        expect(worldAccount.systems.length).to.be.greaterThan(0);
    });

    it("Apply unauthorized Fly System on Entity 1", async () => {
        const applySystem = await ApplySystem({
          authority: framework.provider.wallet.publicKey,
          systemId: framework.systemFly.programId,
          world: framework.worldPda,
          entities: [
            {
              entity: framework.entity1Pda,
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
              sessionToken: null
            })
            .rpc();
        } catch (error) {
          expect(error.message).to.contain("Error Code: InvalidCaller");
          invalid = true;
        }
        expect(invalid).to.equal(true);
    });
}