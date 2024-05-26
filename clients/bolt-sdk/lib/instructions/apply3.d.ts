import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface Apply3InstructionArgs {
    args: Uint8Array;
}
export declare const apply3Struct: beet.FixableBeetArgsStruct<Apply3InstructionArgs & {
    instructionDiscriminator: number[];
}>;
export interface Apply3InstructionAccounts {
    boltSystem: web3.PublicKey;
    componentProgram1: web3.PublicKey;
    boltComponent1: web3.PublicKey;
    componentProgram2: web3.PublicKey;
    boltComponent2: web3.PublicKey;
    componentProgram3: web3.PublicKey;
    boltComponent3: web3.PublicKey;
    authority?: web3.PublicKey;
    instructionSysvarAccount?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const apply3InstructionDiscriminator: number[];
export declare function createApply3Instruction(accounts: Apply3InstructionAccounts, args: Apply3InstructionArgs, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=apply3.d.ts.map