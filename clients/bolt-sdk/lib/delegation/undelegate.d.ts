import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const undelegateStruct: beet.FixableBeetArgsStruct<{
  instructionDiscriminator: number[];
}>;
export interface UndelegateInstructionAccounts {
  payer: web3.PublicKey;
  delegatedAccount: web3.PublicKey;
  ownerProgram: web3.PublicKey;
  buffer?: web3.PublicKey;
  commitStatePda?: web3.PublicKey;
  commitStateRecordPda?: web3.PublicKey;
  delegationRecord?: web3.PublicKey;
  delegateAccountSeeds?: web3.PublicKey;
  reimbursement: web3.PublicKey;
  systemProgram?: web3.PublicKey;
}
export declare const undelegateInstructionDiscriminator: number[];
export declare function createUndelegateInstruction(
  accounts: UndelegateInstructionAccounts,
  programId?: web3.PublicKey
): web3.TransactionInstruction;
//# sourceMappingURL=undelegate.d.ts.map
