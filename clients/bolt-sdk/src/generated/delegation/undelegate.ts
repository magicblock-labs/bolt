import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import { DELEGATION_PROGRAM_ID, getDelegationAccounts } from "./accounts";
import { PublicKey } from "@solana/web3.js";

export const undelegateStruct = new beet.FixableBeetArgsStruct<{
  instructionDiscriminator: number[];
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "UndelegateInstructionArgs"
);

/**
 * Accounts required by the _undelegate_ instruction
 */

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

export const undelegateInstructionDiscriminator = [3, 0, 0, 0, 0, 0, 0, 0];

/**
 * Creates an _undelegate_ instruction.
 *
 */

export function createUndelegateInstruction(
  accounts: UndelegateInstructionAccounts,
  programId = new PublicKey(DELEGATION_PROGRAM_ID)
) {
  const [data] = undelegateStruct.serialize({
    instructionDiscriminator: undelegateInstructionDiscriminator,
  });

  const {
    delegationPda,
    delegatedAccountSeedsPda,
    bufferPda,
    commitStateRecordPda,
    commitStatePda,
  } = getDelegationAccounts(
    accounts.delegatedAccount,
    accounts.ownerProgram,
    false
  );

  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.delegatedAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.ownerProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.buffer ?? bufferPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.commitStatePda ?? commitStatePda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.commitStateRecordPda ?? commitStateRecordPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.delegationRecord ?? delegationPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.delegateAccountSeeds ?? delegatedAccountSeedsPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.reimbursement,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  return new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
}
