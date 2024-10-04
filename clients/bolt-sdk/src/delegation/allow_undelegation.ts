import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import {
  DelegateAccounts,
  DELEGATION_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";

export const allowUndelegationStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "allowUndelegationInstructionArgs",
);

export interface AllowUndelegationInstructionAccounts {
  delegatedAccount: web3.PublicKey;
  ownerProgram: web3.PublicKey;
  buffer?: web3.PublicKey;
}

export const allowUndelegateInstructionDiscriminator = [
  255, 66, 82, 208, 247, 5, 210, 126,
];

/**
 * Creates a Delegate instruction.
 */

export function createAllowUndelegationInstruction(
  accounts: AllowUndelegationInstructionAccounts,
) {
  const [data] = allowUndelegationStruct.serialize({
    instructionDiscriminator: allowUndelegateInstructionDiscriminator,
  });

  const { delegationPda, delegationMetadata, bufferPda } = DelegateAccounts(
    accounts.delegatedAccount,
    accounts.ownerProgram,
  );

  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.delegatedAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: delegationPda,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: delegationMetadata,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: bufferPda,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: new web3.PublicKey(DELEGATION_PROGRAM_ID),
      isWritable: true,
      isSigner: false,
    },
  ];

  const programId = accounts.ownerProgram;
  return new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
}
