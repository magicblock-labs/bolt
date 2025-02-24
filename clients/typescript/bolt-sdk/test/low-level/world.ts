import { anchor, FindRegistryPda, FindWorldPda, BN } from "../../lib";

export function world(framework) {
  describe("World", () => {
    it("Initialize registry", async () => {
      const registryPda = FindRegistryPda({});
      const instruction = await framework.worldProgram.methods
        .initializeRegistry()
        .accounts({
          registry: registryPda,
          payer: framework.provider.wallet.publicKey,
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      try {
        await framework.provider.sendAndConfirm(transaction);
      } catch (e) {
        // The registry might already exist
      }
    });

    it("Initialize world", async () => {
      const registryPda = FindRegistryPda({});
      const registry =
        await framework.worldProgram.account.registry.fetch(registryPda);
      framework.worldId = new BN(registry.worlds);
      framework.worldPda = FindWorldPda({ worldId: framework.worldId });
      const instruction = await framework.worldProgram.methods
        .initializeNewWorld()
        .accounts({
          payer: framework.provider.wallet.publicKey,
          world: framework.worldPda,
          registry: registryPda,
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction);
    });

    it("Initialize second world", async () => {
      const registryPda = FindRegistryPda({});
      const registry =
        await framework.worldProgram.account.registry.fetch(registryPda);
      const worldId = new BN(registry.worlds);
      const worldPda = FindWorldPda({ worldId });
      const instruction = await framework.worldProgram.methods
        .initializeNewWorld()
        .accounts({
          payer: framework.provider.wallet.publicKey,
          world: worldPda,
          registry: registryPda,
        })
        .instruction();
      const transaction = new anchor.web3.Transaction().add(instruction);
      await framework.provider.sendAndConfirm(transaction);
    });
  });
}
