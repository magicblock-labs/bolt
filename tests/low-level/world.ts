import BN from "bn.js";
import { anchor, FindRegistryPda, FindWorldPda } from "../../clients/bolt-sdk/lib";

export function world(framework) {
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
    await framework.provider.sendAndConfirm(transaction);
  });

  it("Initialize world", async () => {
    const registryPda = FindRegistryPda({});
    const registry = await framework.worldProgram.account.registry.fetch(registryPda);
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
    const registry = await framework.worldProgram.account.registry.fetch(registryPda);
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
}
