import {
  anchor,
  DelegateComponent,
  DELEGATION_PROGRAM_ID,
} from "../../clients/bolt-sdk/lib";
import { expect } from "chai";

export function acceleration(framework) {
  describe("Acceleration", () => {
    it("Check component delegation to accelerator", async () => {
      const delegateComponent = await DelegateComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        componentId: framework.exampleComponentPosition.programId,
      });
      const instruction = delegateComponent.transaction;
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction, [], {
        skipPreflight: true,
        commitment: "confirmed",
      });
      const acc = await framework.provider.connection.getAccountInfo(
        delegateComponent.componentPda,
      );
      expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
    });
  });
};
