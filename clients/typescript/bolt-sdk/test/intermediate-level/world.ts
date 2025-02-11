import {
  InitializeNewWorld,
  InitializeRegistry,
} from "../../lib";

export function world(framework) {
  describe("World", () => {
    it("Initialize registry", async () => {
      const initializeRegistry = await InitializeRegistry({
        payer: framework.provider.wallet.publicKey,
        connection: framework.provider.connection,
      });
      try {
        await framework.provider.sendAndConfirm(initializeRegistry.transaction);
      } catch (error) {
        // This is expected to fail because the registry already exists if another api level test ran before
      }
    });

    it("Initialize world", async () => {
      const initializeNewWorld = await InitializeNewWorld({
        payer: framework.provider.wallet.publicKey,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(initializeNewWorld.transaction);
      framework.worldPda = initializeNewWorld.worldPda; // Saved for later
    });

    it("Initialize second world", async () => {
      const initializeNewWorld = await InitializeNewWorld({
        payer: framework.provider.wallet.publicKey,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(initializeNewWorld.transaction);
    });
  });
}
