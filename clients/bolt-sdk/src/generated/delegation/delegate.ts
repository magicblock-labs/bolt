import { PublicKey } from "@solana/web3.js";

const SEED_BUFFER_PDA = "buffer";
const SEED_DELEGATION_PDA = "delegation";
const DELEGATED_ACCOUNT_SEEDS = "account-seeds";
const SEED_COMMIT_STATE_RECORD_PDA = "commit-state-record";
const SEED_STATE_DIFF_PDA = "state-diff";
export const DELEGATION_PROGRAM_ID =
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";

export function getDelegationAccounts(
  accountToDelegate: PublicKey,
  ownerProgram: PublicKey,
  ownedBuffer: boolean = true
) {
  const pdaBytes = accountToDelegate.toBytes();

  const [delegationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_DELEGATION_PDA), pdaBytes],
    new PublicKey(DELEGATION_PROGRAM_ID)
  );

  const [delegatedAccountSeedsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(DELEGATED_ACCOUNT_SEEDS), pdaBytes],
    new PublicKey(DELEGATION_PROGRAM_ID)
  );

  const [bufferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_BUFFER_PDA), pdaBytes],
    ownedBuffer
      ? new PublicKey(ownerProgram)
      : new PublicKey(DELEGATION_PROGRAM_ID)
  );

  const [commitStateRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_COMMIT_STATE_RECORD_PDA), pdaBytes],
    new PublicKey(DELEGATION_PROGRAM_ID)
  );

  const [newStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_STATE_DIFF_PDA), pdaBytes],
    new PublicKey(DELEGATION_PROGRAM_ID)
  );
  return {
    delegationPda,
    delegatedAccountSeedsPda,
    bufferPda,
    commitStateRecordPda,
    newStatePda,
  };
}
