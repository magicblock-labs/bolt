import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface ApplyInstructionArgs {
    args: Uint8Array;
}
export declare const applyStruct: beet.FixableBeetArgsStruct<ApplyInstructionArgs & {
    instructionDiscriminator: number[];
}>;
export interface ApplyInstructionAccounts {
    componentProgram: web3.PublicKey;
    boltSystem: web3.PublicKey;
    boltComponent: web3.PublicKey;
    authority?: web3.PublicKey;
    instructionSysvarAccount?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const applyInstructionDiscriminator: number[];
export declare function createApplyInstruction(accounts: ApplyInstructionAccounts, args: ApplyInstructionArgs, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=apply.d.ts.map