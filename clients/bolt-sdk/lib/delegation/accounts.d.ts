import { PublicKey } from "@solana/web3.js";
export declare const DELEGATION_PROGRAM_ID =
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
export declare function getDelegationAccounts(
  accountToDelegate: PublicKey,
  ownerProgram: PublicKey,
  ownedBuffer?: boolean
): {
  delegationPda: PublicKey;
  delegatedAccountSeedsPda: PublicKey;
  bufferPda: PublicKey;
  commitStateRecordPda: PublicKey;
  commitStatePda: PublicKey;
};
//# sourceMappingURL=accounts.d.ts.map
