import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface Apply4InstructionArgs {
    args: Uint8Array;
}
export declare const apply4Struct: beet.FixableBeetArgsStruct<Apply4InstructionArgs & {
    instructionDiscriminator: number[];
}>;
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
    authority?: web3.PublicKey;
    instructionSysvarAccount?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const apply4InstructionDiscriminator: number[];
export declare function createApply4Instruction(accounts: Apply4InstructionAccounts, args: Apply4InstructionArgs, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=apply4.d.ts.map