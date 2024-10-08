/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";

/**
 * @category Instructions
 * @category InitializeComponent
 * @category generated
 */
export const initializeComponentStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "InitializeComponentInstructionArgs",
);
/**
 * Accounts required by the _initializeComponent_ instruction
 *
 * @property [_writable_, **signer**] payer
 * @property [_writable_] data
 * @property [] entity
 * @property [] componentProgram
 * @property [] authority
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category InitializeComponent
 * @category generated
 */
export interface InitializeComponentInstructionAccounts {
  payer: web3.PublicKey;
  data: web3.PublicKey;
  entity: web3.PublicKey;
  componentProgram: web3.PublicKey;
  authority: web3.PublicKey;
  instructionSysvarAccount: web3.PublicKey;
  systemProgram?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}

export const initializeComponentInstructionDiscriminator = [
  36, 143, 233, 113, 12, 234, 61, 30,
];

/**
 * Creates a _InitializeComponent_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitializeComponent
 * @category generated
 */
export function createInitializeComponentInstruction(
  accounts: InitializeComponentInstructionAccounts,
  programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"),
) {
  const [data] = initializeComponentStruct.serialize({
    instructionDiscriminator: initializeComponentInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.data,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.entity,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.componentProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.instructionSysvarAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
