import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export interface DelegateInstructionArgs {
    validUntil: beet.bignum;
    commitFrequencyMs: number;
}
export declare const delegateStruct: beet.FixableBeetArgsStruct<DelegateInstructionArgs & {
    instructionDiscriminator: number[];
}>;
export interface DelegateInstructionAccounts {
    payer: web3.PublicKey;
    entity: web3.PublicKey;
    account: web3.PublicKey;
    ownerProgram: web3.PublicKey;
    buffer?: web3.PublicKey;
    delegationRecord?: web3.PublicKey;
    delegateAccountSeeds?: web3.PublicKey;
    delegationProgram?: web3.PublicKey;
    systemProgram?: web3.PublicKey;
}
export declare const delegateInstructionDiscriminator: number[];
export declare function createDelegateInstruction(accounts: DelegateInstructionAccounts, validUntil?: beet.bignum, commitFrequencyMs?: number, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=delegate.d.ts.map