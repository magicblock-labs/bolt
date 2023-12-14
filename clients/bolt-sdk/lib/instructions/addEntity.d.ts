import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const addEntityStruct: beet.BeetArgsStruct<{
    instructionDiscriminator: number[];
}>;
export interface AddEntityInstructionAccounts {
    payer: web3.PublicKey;
    entity: web3.PublicKey;
    world: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}
export declare const addEntityInstructionDiscriminator: number[];
export declare function createAddEntityInstruction(accounts: AddEntityInstructionAccounts, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=addEntity.d.ts.map