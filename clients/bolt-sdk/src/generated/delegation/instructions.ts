import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import { DELEGATION_PROGRAM_ID, getDelegationAccounts } from "./delegate";

export const DelegateArgsStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "DelegateInstructionArgs"
);

/**
 * Accounts required by the _apply_ instruction
 *
 * @property [] componentProgram
 * @property [] boltSystem
 * @property [_writable_] boltComponent
 * @property [] authority
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category Apply
 * @category generated
 */

export interface DelegateInstructionAccounts {
  payer: web3.PublicKey;
  entity: web3.PublicKey;
  account: web3.PublicKey;
  ownerProgram: web3.PublicKey;
  buffer?: web3.PublicKey;
  delegation_record?: web3.PublicKey;
  delegate_account_seeds?: web3.PublicKey;
  delegation_program?: web3.PublicKey;
  system_program?: web3.PublicKey;
}

export const delegateInstructionDiscriminator = [
  90, 147, 75, 178, 85, 88, 4, 137,
];

/**
 * Creates a _Apply_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @param programId
 * @category Instructions
 * @category Apply
 * @category generated
 */

export function createDelegateInstruction(
  accounts: DelegateInstructionAccounts,
  programId = accounts.ownerProgram
) {
  const [data] = DelegateArgsStruct.serialize({
    instructionDiscriminator: delegateInstructionDiscriminator,
  });

  const { delegationPda, delegatedAccountSeedsPda, bufferPda } =
    getDelegationAccounts(accounts.account, accounts.ownerProgram);

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
      pubkey: accounts.delegation_record ?? delegationPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.delegate_account_seeds ?? delegatedAccountSeedsPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey:
        accounts.delegation_program ??
        new web3.PublicKey(DELEGATION_PROGRAM_ID),
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.system_program ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
