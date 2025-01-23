import { anchor, SessionProgram } from "../../clients/bolt-sdk/lib";

// TODO: Create the API for it.
export function session(framework) {
  it("Create Session", async () => {
    const airdrop = await framework.provider.connection.requestAirdrop(
      framework.sessionSigner.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );

    await framework.provider.connection.confirmTransaction(
      airdrop,
      "confirmed",
    );

    const keys = await SessionProgram.methods
      .createSession(true, null)
      .accounts({
        sessionSigner: framework.sessionSigner.publicKey,
        authority: framework.provider.wallet.publicKey,
        targetProgram: framework.exampleComponentPosition.programId,
      })
      .signers([framework.sessionSigner])
      .rpcAndKeys();
    framework.sessionToken = keys.pubkeys.sessionToken as anchor.web3.PublicKey;
  });
}
