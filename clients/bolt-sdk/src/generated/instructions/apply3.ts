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
 * @category Apply3
 * @category generated
 */
export interface Apply3InstructionArgs {
  args: Uint8Array;
}
/**
 * @category Instructions
 * @category Apply3
 * @category generated
 */
export const apply3Struct = new beet.FixableBeetArgsStruct<
  Apply3InstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["args", beet.bytes],
  ],
  "Apply3InstructionArgs"
);
/**
 * Accounts required by the _apply3_ instruction
 *
 * @property [] boltSystem
 * @property [] componentProgram1
 * @property [_writable_] boltComponent1
 * @property [] componentProgram2
 * @property [_writable_] boltComponent2
 * @property [] componentProgram3
 * @property [_writable_] boltComponent3
 * @category Instructions
 * @category Apply3
 * @category generated
 */
export interface Apply3InstructionAccounts {
  boltSystem: web3.PublicKey;
  componentProgram1: web3.PublicKey;
  boltComponent1: web3.PublicKey;
  componentProgram2: web3.PublicKey;
  boltComponent2: web3.PublicKey;
  componentProgram3: web3.PublicKey;
  boltComponent3: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}

export const apply3InstructionDiscriminator = [
  254, 146, 49, 7, 236, 131, 105, 221,
];

/**
 * Creates a _Apply3_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Apply3
 * @category generated
 */
export function createApply3Instruction(
  accounts: Apply3InstructionAccounts,
  args: Apply3InstructionArgs,
  programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n")
) {
  const [data] = apply3Struct.serialize({
    instructionDiscriminator: apply3InstructionDiscriminator,
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
