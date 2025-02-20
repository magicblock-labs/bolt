import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import {
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";

export const undelegateStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "undelegateInstructionArgs",
);

export interface UndelegateInstructionAccounts {
  payer: web3.PublicKey;
  delegatedAccount: web3.PublicKey;
  componentPda: web3.PublicKey;
}

export const undelegateInstructionDiscriminator = [
  131, 148, 180, 198, 91, 104, 42, 238,
];

/**
 * Creates an Undelegate instruction.
 */
export function createUndelegateInstruction(
  accounts: UndelegateInstructionAccounts,
) {
  const [data] = undelegateStruct.serialize({
    instructionDiscriminator: undelegateInstructionDiscriminator,
  });

  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.delegatedAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: new web3.PublicKey(MAGIC_CONTEXT_ID),
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: new web3.PublicKey(MAGIC_PROGRAM_ID),
      isWritable: false,
      isSigner: false,
    },
  ];

  return new web3.TransactionInstruction({
    programId: accounts.componentPda,
    keys,
    data,
  });
}
