import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import {
  DelegateAccounts,
  DELEGATION_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { FindComponentPda } from "../index";
import {
  type PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";

export interface DelegateInstructionArgs {
  validUntil: beet.bignum;
  commitFrequencyMs: number;
}

export const delegateStruct = new beet.FixableBeetArgsStruct<
  DelegateInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["validUntil", beet.i64],
    ["commitFrequencyMs", beet.u32],
  ],
  "DelegateInstructionArgs",
);

/**
 * Accounts required by the _delegate_ instruction
 *
 */

export interface DelegateInstructionAccounts {
  payer: web3.PublicKey;
  entity: web3.PublicKey;
  account: web3.PublicKey;
  ownerProgram: web3.PublicKey;
  buffer?: web3.PublicKey;
  delegationRecord?: web3.PublicKey;
  delegationMetadata?: web3.PublicKey;
  delegationProgram?: web3.PublicKey;
  systemProgram?: web3.PublicKey;
}

export const delegateInstructionDiscriminator = [
  90, 147, 75, 178, 85, 88, 4, 137,
];

/**
 * Creates a Delegate instruction.
 */

export function createDelegateInstruction(
  accounts: DelegateInstructionAccounts,
  validUntil: beet.bignum = 0,
  commitFrequencyMs: number = 30000,
  programId = accounts.ownerProgram,
) {
  const [data] = delegateStruct.serialize({
    instructionDiscriminator: delegateInstructionDiscriminator,
    validUntil,
    commitFrequencyMs,
  });

  const { delegationPda, delegationMetadata, bufferPda } = DelegateAccounts(
    accounts.account,
    accounts.ownerProgram,
  );

  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.entity,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.account,
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
      pubkey: accounts.delegationRecord ?? delegationPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.delegationMetadata ?? delegationMetadata,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey:
        accounts.delegationProgram ?? new web3.PublicKey(DELEGATION_PROGRAM_ID),
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

/**
 * Create the transaction to Delegate a component
 * @param payer
 * @param entityPda
 * @param componentId
 * @param seeds
 * @param buffer
 * @param delegationRecord
 * @param delegationMetadata
 * @param delegationProgram
 * @param systemProgram
 * @constructor
 */
export async function DelegateComponent({
  payer,
  entity,
  componentId,
  seed = "",
  buffer,
  delegationRecord,
  delegationMetadata,
  delegationProgram,
  systemProgram,
}: {
  payer: PublicKey;
  entity: PublicKey;
  componentId: PublicKey;
  seed?: string;
  buffer?: web3.PublicKey;
  delegationRecord?: web3.PublicKey;
  delegationMetadata?: web3.PublicKey;
  delegationProgram?: web3.PublicKey;
  systemProgram?: web3.PublicKey;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  componentPda: PublicKey;
}> {
  const componentPda = FindComponentPda({ componentId, entity, seed });
  const delegateComponentIx = createDelegateInstruction({
    payer,
    entity,
    account: componentPda,
    ownerProgram: componentId,
    buffer,
    delegationRecord,
    delegationMetadata,
    delegationProgram,
    systemProgram,
  });

  return {
    instruction: delegateComponentIx,
    transaction: new Transaction().add(delegateComponentIx),
    componentPda,
  };
}
