import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const initializeNewWorldStruct: beet.BeetArgsStruct<{
  instructionDiscriminator: number[];
}>;
export interface InitializeNewWorldInstructionAccounts {
  payer: web3.PublicKey;
  world: web3.PublicKey;
  registry: web3.PublicKey;
  systemProgram?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const initializeNewWorldInstructionDiscriminator: number[];
export declare function createInitializeNewWorldInstruction(
  accounts: InitializeNewWorldInstructionAccounts,
  programId?: web3.PublicKey
): web3.TransactionInstruction;
//# sourceMappingURL=initializeNewWorld.d.ts.map
