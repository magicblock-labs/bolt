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
 * @category Apply4
 * @category generated
 */
export interface Apply4InstructionArgs {
  args: Uint8Array;
}
/**
 * @category Instructions
 * @category Apply4
 * @category generated
 */
export const apply4Struct = new beet.FixableBeetArgsStruct<
  Apply4InstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['args', beet.bytes],
  ],
  'Apply4InstructionArgs',
);
/**
 * Accounts required by the _apply4_ instruction
 *
 * @property [] boltSystem
 * @property [] componentProgram1
 * @property [_writable_] boltComponent1
 * @property [] componentProgram2
 * @property [_writable_] boltComponent2
 * @property [] componentProgram3
 * @property [_writable_] boltComponent3
 * @property [] componentProgram4
 * @property [_writable_] boltComponent4
 * @property [] authority
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category Apply4
 * @category generated
 */
export interface Apply4InstructionAccounts {
  boltSystem: web3.PublicKey;
  componentProgram1: web3.PublicKey;
  boltComponent1: web3.PublicKey;
  componentProgram2: web3.PublicKey;
  boltComponent2: web3.PublicKey;
  componentProgram3: web3.PublicKey;
  boltComponent3: web3.PublicKey;
  componentProgram4: web3.PublicKey;
  boltComponent4: web3.PublicKey;
  authority: web3.PublicKey;
  instructionSysvarAccount: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}

export const apply4InstructionDiscriminator = [
  223, 104, 24, 79, 252, 196, 14, 109,
];

/**
 * Creates a _Apply4_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Apply4
 * @category generated
 */
export function createApply4Instruction(
  accounts: Apply4InstructionAccounts,
  args: Apply4InstructionArgs,
  programId = new web3.PublicKey('WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n'),
) {
  const [data] = apply4Struct.serialize({
    instructionDiscriminator: apply4InstructionDiscriminator,
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
      pubkey: accounts.componentProgram3,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.boltComponent3,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.componentProgram4,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.boltComponent4,
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
