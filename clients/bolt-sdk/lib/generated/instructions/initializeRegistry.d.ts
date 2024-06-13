import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const initializeRegistryStruct: beet.BeetArgsStruct<{
    instructionDiscriminator: number[];
}>;
export interface InitializeRegistryInstructionAccounts {
    registry: web3.PublicKey;
    payer: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const initializeRegistryInstructionDiscriminator: number[];
export declare function createInitializeRegistryInstruction(accounts: InitializeRegistryInstructionAccounts, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=initializeRegistry.d.ts.map