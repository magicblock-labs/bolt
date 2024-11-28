const boltSdk = require("@magicblock-labs/bolt-sdk");
const {{
    InitializeNewWorld,
}} = boltSdk;
const anchor = require("@coral-xyz/anchor");

describe("{}", () => {{
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Constants used to test the program.
  let worldPda: PublicKey;

  it("InitializeNewWorld", async () => {{
    const initNewWorld = await InitializeNewWorld({{
      payer: provider.wallet.publicKey,
      connection: provider.connection,
    }});
    const txSign = await provider.sendAndConfirm(initNewWorld.transaction);
    worldPda = initNewWorld.worldPda;
    console.log(`Initialized a new world (ID=${{worldPda}}). Initialization signature: ${{txSign}}`);
    }});
  }});
