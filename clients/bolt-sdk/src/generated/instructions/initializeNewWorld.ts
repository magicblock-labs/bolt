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
 * @category InitializeNewWorld
 * @category generated
 */
export type InitializeNewWorldInstructionArgs = {
  extraSeed: beet.COption<string>;
};

export const initializeNewWorldStruct = new beet.FixableBeetArgsStruct<
  InitializeNewWorldInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["extraSeed", beet.coption(beet.utf8String)],
  ],
  "InitializeNewWorldInstructionArgs",
);
/**
 * Accounts required by the _initializeNewWorld_ instruction
 *
 * @property [_writable_, **signer**] payer
 * @property [_writable_] world
 * @property [_writable_] registry
 * @category Instructions
 * @category InitializeNewWorld
 * @category generated
 */
export interface InitializeNewWorldInstructionAccounts {
  payer: web3.PublicKey;
  world: web3.PublicKey;
  registry: web3.PublicKey;
  systemProgram?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}

export const initializeNewWorldInstructionDiscriminator = [
  23, 96, 88, 194, 200, 203, 200, 98,
];

/**
 * Creates a _InitializeNewWorld_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitializeNewWorld
 * @category generated
 */
export function createInitializeNewWorldInstruction(
  accounts: InitializeNewWorldInstructionAccounts,
  args: InitializeNewWorldInstructionArgs,
  programId = new web3.PublicKey(
    "FBmdiXs7YwX7Q1HNvqM2CKtRbthode4Qf9dkhho4r2xp",
  ),
) {
  const [data] = initializeNewWorldStruct.serialize({
    instructionDiscriminator: initializeNewWorldInstructionDiscriminator,
    ...args,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.world,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.registry,
      isWritable: true,
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
