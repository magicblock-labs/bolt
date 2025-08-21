import {
  web3,
  AddEntity,
  ApplySystem,
  InitializeComponent,
  DestroyComponent,
} from "../../lib";
import { Direction, Framework } from "../framework";
import { expect } from "chai";

export function ecs(framework: Framework) {
  describe("ECS", () => {
    it("Add entity 1", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      framework.entity1Pda = addEntity.entityPda; // Saved for later
    });

    it("Add entity 2", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      framework.entity2Pda = addEntity.entityPda; // Saved for later
    });

    it("Add entity 3", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
    });

    it("Add entity 4 (with seed)", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        seed: Buffer.from("custom-seed"),
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      framework.entity4Pda = addEntity.entityPda;
    });

    it("Initialize Velocity Component on Entity 1 (with seed)", async () => {
      const initializeComponent = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        componentId: framework.exampleComponentVelocity.programId,
        seed: "component-velocity",
        authority: framework.provider.wallet.publicKey,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction);
      framework.componentVelocityEntity1Pda = initializeComponent.componentPda; // Saved for later
    });

    it("Initialize Position Component on Entity 1", async () => {
      const initializeComponent = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        componentId: framework.exampleComponentPosition.programId,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction);
      framework.componentPositionEntity1Pda = initializeComponent.componentPda; // Saved for later
    });

    it("Initialize Position Component on Entity 2", async () => {
      const initializeComponent = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity2Pda,
        componentId: framework.exampleComponentPosition.programId,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction);
    });

    it("Initialize Position Component on Entity 4", async () => {
      const initializeComponent = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity4Pda,
        componentId: framework.exampleComponentPosition.programId,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction);
      framework.componentPositionEntity4Pda = initializeComponent.componentPda; // Saved for later
    });

    it("Check Position on Entity 1 is default", async () => {
      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.equal(0);
      expect(position.y.toNumber()).to.equal(0);
      expect(position.z.toNumber()).to.equal(0);
    });

    it("Apply Simple Movement System (Up) on Entity 1", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemSimpleMovement.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity1Pda,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
        args: {
          direction: Direction.Up,
        },
      });
      await framework.provider.sendAndConfirm(applySystem.transaction, [], {
        skipPreflight: true,
      });

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.equal(0);
      expect(position.y.toNumber()).to.equal(1);
      expect(position.z.toNumber()).to.equal(0);
    });

    it("Apply Simple Movement System (Right) on Entity 1", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemSimpleMovement.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity1Pda,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
        args: {
          direction: Direction.Right,
        },
      });
      await framework.provider.sendAndConfirm(applySystem.transaction);

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.equal(1);
      expect(position.y.toNumber()).to.equal(1);
      expect(position.z.toNumber()).to.equal(0);
    });

    it("Apply Fly System on Entity 1", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity1Pda,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });
      await framework.provider.sendAndConfirm(applySystem.transaction);

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.equal(1);
      expect(position.y.toNumber()).to.equal(1);
      expect(position.z.toNumber()).to.equal(1);
    });

    it("Apply System Velocity on Entity 1", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemApplyVelocity.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity1Pda,
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

      const velocity =
        await framework.exampleComponentVelocity.account.velocity.fetch(
          framework.componentVelocityEntity1Pda,
        );
      expect(velocity.x.toNumber()).to.equal(10);
      expect(velocity.y.toNumber()).to.equal(0);
      expect(velocity.z.toNumber()).to.equal(0);
      expect(velocity.lastApplied.toNumber()).to.not.equal(0);

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.greaterThan(1);
      expect(position.y.toNumber()).to.equal(1);
      expect(position.z.toNumber()).to.equal(1);
    });

    it("Apply System Velocity on Entity 1, with Clock external account", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemApplyVelocity.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity1Pda,
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
      let signature = await framework.provider.sendAndConfirm(
        applySystem.transaction,
      );

      let transactionResponse: any;
      do {
        transactionResponse =
          await framework.provider.connection.getTransaction(signature, {
            commitment: "confirmed",
          });
      } while (transactionResponse?.meta?.logMessages === undefined);

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity1Pda,
        );
      expect(position.x.toNumber()).to.greaterThan(1);
      expect(position.y.toNumber()).to.equal(1);
      expect(position.z.toNumber()).to.equal(300);
    });

    it("Apply System With Few Components on Entity 1", async () => {
      let entitiesPdas: web3.PublicKey[] = [];
      for (let i = 0; i < 5; i++) {
        const addEntity = await AddEntity({
          payer: framework.provider.wallet.publicKey,
          world: framework.worldPda,
          connection: framework.provider.connection,
        });
        await framework.provider.sendAndConfirm(addEntity.transaction);
        entitiesPdas.push(addEntity.entityPda);
      }

      let componentsPdas: web3.PublicKey[] = [];
      for (let i = 0; i < 5; i++) {
        const initializeComponent = await InitializeComponent({
          payer: framework.provider.wallet.publicKey,
          entity: entitiesPdas[i],
          componentId: framework.componentLarge.programId,
        });
        await framework.provider.sendAndConfirm(
          initializeComponent.transaction,
        );
        componentsPdas.push(initializeComponent.componentPda);
      }

      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemWithFewComponents.programId,
        world: framework.worldPda,
        entities: entitiesPdas.map((entity) => ({
          entity,
          components: [{ componentId: framework.componentLarge.programId }],
        })),
      });
      let signature = await framework.provider.sendAndConfirm(
        applySystem.transaction,
      );

      let transactionResponse: any;
      do {
        transactionResponse =
          await framework.provider.connection.getTransaction(signature, {
            commitment: "confirmed",
          });
      } while (transactionResponse?.meta?.logMessages === undefined);
      framework.report(transactionResponse?.meta?.logMessages);
    });

    it("Apply System With Many Components on Entity 1", async () => {
      let entitiesPdas: web3.PublicKey[] = [];
      for (let i = 0; i < 10; i++) {
        const addEntity = await AddEntity({
          payer: framework.provider.wallet.publicKey,
          world: framework.worldPda,
          connection: framework.provider.connection,
        });
        await framework.provider.sendAndConfirm(addEntity.transaction);
        entitiesPdas.push(addEntity.entityPda);
      }

      let componentsPdas: web3.PublicKey[] = [];
      for (let i = 0; i < 10; i++) {
        const initializeComponent = await InitializeComponent({
          payer: framework.provider.wallet.publicKey,
          entity: entitiesPdas[i],
          componentId: framework.componentSmall.programId,
        });
        await framework.provider.sendAndConfirm(
          initializeComponent.transaction,
        );
        componentsPdas.push(initializeComponent.componentPda);
      }

      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemWithManyComponents.programId,
        world: framework.worldPda,
        entities: entitiesPdas.map((entity) => ({
          entity,
          components: [{ componentId: framework.componentSmall.programId }],
        })),
      });
      let signature = await framework.provider.sendAndConfirm(
        applySystem.transaction,
      );

      let transactionResponse: any;
      do {
        transactionResponse =
          await framework.provider.connection.getTransaction(signature, {
            commitment: "confirmed",
          });
      } while (transactionResponse?.meta?.logMessages === undefined);
      framework.report(transactionResponse?.meta?.logMessages);
    });

    it("Apply Fly System on Entity 4", async () => {
      const applySystem = await ApplySystem({
        authority: framework.provider.wallet.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        entities: [
          {
            entity: framework.entity4Pda,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });
      await framework.provider.sendAndConfirm(applySystem.transaction);

      const position =
        await framework.exampleComponentPosition.account.position.fetch(
          framework.componentPositionEntity4Pda,
        );
      expect(position.x.toNumber()).to.equal(0);
      expect(position.y.toNumber()).to.equal(0);
      expect(position.z.toNumber()).to.equal(1);
    });

    it("Destroy Velocity Component on Entity 1", async () => {
      const keypair = web3.Keypair.generate();

      let componentBalance = await framework.provider.connection.getBalance(
        framework.componentVelocityEntity1Pda,
      );

      const destroyComponent = await DestroyComponent({
        authority: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        componentId: framework.exampleComponentVelocity.programId,
        receiver: keypair.publicKey,
        seed: "component-velocity",
      });
      await framework.provider.sendAndConfirm(destroyComponent.transaction);

      const balance = await framework.provider.connection.getBalance(
        keypair.publicKey,
      );
      expect(balance).to.equal(componentBalance);
    });
  });
}
