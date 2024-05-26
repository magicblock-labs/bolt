import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface Apply5InstructionArgs {
  args: Uint8Array;
}
export declare const apply5Struct: beet.FixableBeetArgsStruct<
  Apply5InstructionArgs & {
    instructionDiscriminator: number[];
  }
>;
export interface Apply5InstructionAccounts {
  boltSystem: web3.PublicKey;
  componentProgram1: web3.PublicKey;
  boltComponent1: web3.PublicKey;
  componentProgram2: web3.PublicKey;
  boltComponent2: web3.PublicKey;
  componentProgram3: web3.PublicKey;
  boltComponent3: web3.PublicKey;
  componentProgram4: web3.PublicKey;
  boltComponent4: web3.PublicKey;
  componentProgram5: web3.PublicKey;
  boltComponent5: web3.PublicKey;
  authority?: web3.PublicKey;
  instructionSysvarAccount?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const apply5InstructionDiscriminator: number[];
export declare function createApply5Instruction(
  accounts: Apply5InstructionAccounts,
  args: Apply5InstructionArgs,
  programId?: web3.PublicKey
): web3.TransactionInstruction;
//# sourceMappingURL=apply5.d.ts.map
