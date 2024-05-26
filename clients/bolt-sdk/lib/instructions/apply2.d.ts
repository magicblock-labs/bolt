import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface Apply2InstructionArgs {
  args: Uint8Array;
}
export declare const apply2Struct: beet.FixableBeetArgsStruct<
  Apply2InstructionArgs & {
    instructionDiscriminator: number[];
  }
>;
export interface Apply2InstructionAccounts {
  boltSystem: web3.PublicKey;
  componentProgram1: web3.PublicKey;
  boltComponent1: web3.PublicKey;
  componentProgram2: web3.PublicKey;
  boltComponent2: web3.PublicKey;
  authority?: web3.PublicKey;
  instructionSysvarAccount?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const apply2InstructionDiscriminator: number[];
export declare function createApply2Instruction(
  accounts: Apply2InstructionAccounts,
  args: Apply2InstructionArgs,
  programId?: web3.PublicKey
): web3.TransactionInstruction;
//# sourceMappingURL=apply2.d.ts.map
