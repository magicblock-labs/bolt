import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const initializeComponentStruct: beet.BeetArgsStruct<{
    instructionDiscriminator: number[];
}>;
export interface InitializeComponentInstructionAccounts {
    payer: web3.PublicKey;
    data?: web3.PublicKey;
    entity: web3.PublicKey;
    componentProgram: web3.PublicKey;
    authority?: web3.PublicKey;
    instructionSysvarAccount?: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const initializeComponentInstructionDiscriminator: number[];
export declare function createInitializeComponentInstruction(accounts: InitializeComponentInstructionAccounts, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=initializeComponent.d.ts.map