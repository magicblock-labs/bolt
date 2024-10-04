/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet';
import * as web3 from '@solana/web3.js';

/**
 * @category Instructions
 * @category Apply2
 * @category generated
 */
export interface Apply2InstructionArgs {
  args: Uint8Array;
}
/**
 * @category Instructions
 * @category Apply2
 * @category generated
 */
export const apply2Struct = new beet.FixableBeetArgsStruct<
  Apply2InstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['args', beet.bytes],
  ],
  'Apply2InstructionArgs',
);
/**
 * Accounts required by the _apply2_ instruction
 *
 * @property [] boltSystem
 * @property [] componentProgram1
 * @property [_writable_] boltComponent1
 * @property [] componentProgram2
 * @property [_writable_] boltComponent2
 * @property [] authority
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category Apply2
 * @category generated
 */
export interface Apply2InstructionAccounts {
  boltSystem: web3.PublicKey;
  componentProgram1: web3.PublicKey;
  boltComponent1: web3.PublicKey;
  componentProgram2: web3.PublicKey;
  boltComponent2: web3.PublicKey;
  authority: web3.PublicKey;
  instructionSysvarAccount: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}

export const apply2InstructionDiscriminator = [
  120, 32, 116, 154, 158, 159, 208, 73,
];

/**
 * Creates a _Apply2_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Apply2
 * @category generated
 */
export function createApply2Instruction(
  accounts: Apply2InstructionAccounts,
  args: Apply2InstructionArgs,
  programId = new web3.PublicKey('WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n'),
) {
  const [data] = apply2Struct.serialize({
    instructionDiscriminator: apply2InstructionDiscriminator,
    ...args,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.boltSystem,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.componentProgram1,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.boltComponent1,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.componentProgram2,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.boltComponent2,
      isWritable: true,
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
