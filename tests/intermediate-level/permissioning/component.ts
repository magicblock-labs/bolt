import { assert, expect } from "chai";
import {
  anchor,
  AddEntity,
  ApplySystem,
  InitializeComponent,
} from "../../../clients/bolt-sdk/lib";
import { Keypair } from "@solana/web3.js";

export function component(framework) {
  describe("Component authority", () => {
    let entity: anchor.web3.PublicKey;
    let component: anchor.web3.PublicKey;

    it("Add authority test entity", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      entity = addEntity.entityPda; // Saved for later
    });

    it("Initialize position component with authority on authority test entity", async () => {
      const initializeComponent = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: entity,
        componentId: framework.exampleComponentPosition.programId,
        authority: framework.provider.wallet.publicKey,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction);
      component = initializeComponent.componentPda; // Saved for later
    });

    it("Shouldn't apply fly system on authority test entity with wrong authority", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      let keypair = Keypair.generate();

      const applySystem = await ApplySystem({
        authority: keypair.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: entity,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });

      try {
        await framework.provider.sendAndConfirm(applySystem.transaction, [
          keypair,
        ]);
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

      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        entities: [
          {
            entity,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });

      await framework.provider.sendAndConfirm(applySystem.transaction);

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
