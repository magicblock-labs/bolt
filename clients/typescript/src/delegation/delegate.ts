import * as beet from "@metaplex-foundation/beet";
import * as beetSolana from "@metaplex-foundation/beet-solana";
import * as web3 from "@solana/web3.js";
import {
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  DELEGATION_PROGRAM_ID,
  delegationMetadataPdaFromDelegatedAccount,
  delegationRecordPdaFromDelegatedAccount,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { FindBufferPda, FindComponentPda, Program } from "../index";
import {
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { worldIdl } from "../generated";
import { Idl } from "@coral-xyz/anchor";

export interface DelegateInstructionArgs {
  commitFrequencyMs: number;
  validator: beet.COption<PublicKey>;
}

export const delegateStruct = new beet.FixableBeetArgsStruct<
  DelegateInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["commitFrequencyMs", beet.u32],
    ["validator", beet.coption(beetSolana.publicKey)],
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
  commitFrequencyMs: number = 0,
  validator?: PublicKey,
  programId = accounts.ownerProgram,
) {
  const [data] = delegateStruct.serialize({
    instructionDiscriminator: delegateInstructionDiscriminator,
    commitFrequencyMs,
    validator: validator ?? null,
  });

  const delegationRecord = delegationRecordPdaFromDelegatedAccount(
    accounts.account,
  );

  const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(
    accounts.account,
  );

  const bufferPda = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
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
      pubkey: accounts.delegationRecord ?? delegationRecord,
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
  instructions: TransactionInstruction[];
  transaction: Transaction;
  componentPda: PublicKey;
}> {
  const componentPda = FindComponentPda({ componentId, entity, seed });
  const componentBuffer = FindBufferPda(componentPda);
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

  const componentBufferDelegationRecord =
    delegationRecordPdaFromDelegatedAccount(componentBuffer);

  const componentBufferDelegationMetadata =
    delegationMetadataPdaFromDelegatedAccount(componentBuffer);

  const componentBufferBuffer =
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
      componentBuffer,
      new PublicKey(worldIdl.address),
    );

  const program = new Program(worldIdl as Idl) as unknown as Program;
  const delegateBufferComponentIx = await program.methods
    .delegateBuffer(0, null)
    .accounts({
      payer,
      component: componentPda,
      componentBuffer,
      ownerProgram: worldIdl.address,
      buffer: componentBufferBuffer,
      delegationRecord: componentBufferDelegationRecord,
      delegationMetadata: componentBufferDelegationMetadata,
      delegationProgram: DELEGATION_PROGRAM_ID,
    })
    .instruction();

  return {
    instructions: [delegateComponentIx, delegateBufferComponentIx], // TODO: Make it a single instruction again using the World program as a proxy.
    transaction: new Transaction()
      .add(delegateComponentIx)
      .add(delegateBufferComponentIx),
    componentPda,
  };
}
