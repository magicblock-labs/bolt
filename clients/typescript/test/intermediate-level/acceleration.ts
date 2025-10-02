import {
  AddEntity,
  ApplySystem,
  Component,
  DelegateComponent,
  DELEGATION_PROGRAM_ID,
  InitializeComponent,
} from "../../lib";
import { expect } from "chai";
import { Direction } from "../framework";
import { convertIdlToCamelCase } from "@coral-xyz/anchor/dist/cjs/idl";
import { sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import fs from "fs";
import { Framework } from "../framework";

export function acceleration(framework: Framework) {
  describe("Acceleration", () => {
    it("Create accelerated entity", async () => {
      const createAcceleratedEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });

      framework.acceleratedEntityPda = createAcceleratedEntity.entityPda;

      await framework.provider.sendAndConfirm(
        createAcceleratedEntity.transaction,
      );
    });

    it("Create accelerated component position", async () => {
      const createAcceleratedComponentPosition = await InitializeComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.acceleratedEntityPda,
        componentId: framework.exampleComponentPosition.programId,
      });

      framework.acceleratedComponentPositionPda =
        createAcceleratedComponentPosition.componentPda;

      await framework.provider.sendAndConfirm(
        createAcceleratedComponentPosition.transaction,
      );
    });

    it("Create accelerated bundled component position", async () => {
      const createAcceleratedBundledComponentPosition =
        await InitializeComponent({
          payer: framework.provider.wallet.publicKey,
          entity: framework.acceleratedEntityPda,
          componentId: new Component(
            framework.exampleBundle.programId,
            "position",
          ),
        });

      framework.componentPositionEntity1Pda =
        createAcceleratedBundledComponentPosition.componentPda;

      await framework.provider.sendAndConfirm(
        createAcceleratedBundledComponentPosition.transaction,
      );

      const position = await framework.exampleBundle.account.position.fetch(
        framework.componentPositionEntity1Pda,
      );
      expect(position.x.toNumber()).to.equal(0);
      expect(position.y.toNumber()).to.equal(0);
      expect(position.z.toNumber()).to.equal(0);
    });

    it("Check component delegation to accelerator", async () => {
      const delegateComponent = await DelegateComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.acceleratedEntityPda,
        componentId: framework.exampleComponentPosition.programId,
      });

      await framework.provider.sendAndConfirm(
        delegateComponent.transaction,
        [],
        {
          commitment: "confirmed",
        },
      );
      const acc = await framework.provider.connection.getAccountInfo(
        delegateComponent.componentPda,
      );
      expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
    });

    it("Check bundled component position delegation to accelerator", async () => {
      const delegateComponent = await DelegateComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.acceleratedEntityPda,
        componentId: new Component(
          framework.exampleBundle.programId,
          "position",
        ),
      });
      await framework.provider.sendAndConfirm(
        delegateComponent.transaction,
        [],
        {
          commitment: "confirmed",
        },
      );

      const acc = await framework.provider.connection.getAccountInfo(
        delegateComponent.componentPda,
      );
      expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
    });

    it("Apply Simple Movement System (Up) on Entity 1 on Accelerator 10 times", async () => {
      for (let i = 0; i < 10; i++) {
        let applySystem = await ApplySystem({
          authority: framework.provider.wallet.publicKey,
          systemId: framework.systemSimpleMovement.programId,
          world: framework.worldPda,
          entities: [
            {
              entity: framework.acceleratedEntityPda,
              components: [
                { componentId: framework.exampleComponentPosition.programId },
              ],
            },
          ],
          args: {
            direction: Direction.Up,
          },
        });

        await framework.acceleratorProvider.sendAndConfirm(
          applySystem.transaction,
          [],
          {
            skipPreflight: true,
            commitment: "processed",
          },
        );
        // Wait for 50ms
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
  });
}
