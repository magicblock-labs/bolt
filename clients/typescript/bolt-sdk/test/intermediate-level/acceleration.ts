import {
  DelegateComponent,
  DELEGATION_PROGRAM_ID,
} from "../../lib";
import { expect } from "chai";

export function acceleration(framework) {
  describe("Acceleration", () => {
    it("Check component delegation to accelerator", async () => {
      const delegateComponent = await DelegateComponent({
        payer: framework.provider.wallet.publicKey,
        entity: framework.entity1Pda,
        componentId: framework.exampleComponentPosition.programId,
      });

      await framework.provider.sendAndConfirm(
        delegateComponent.transaction,
        [],
        {
          skipPreflight: true,
          commitment: "confirmed",
        },
      );
      const acc = await framework.provider.connection.getAccountInfo(
        delegateComponent.componentPda,
      );
      expect(acc?.owner.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
    });
  });
}
