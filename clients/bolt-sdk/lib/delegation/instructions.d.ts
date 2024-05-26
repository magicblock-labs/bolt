import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
export declare const DelegateArgsStruct: beet.BeetArgsStruct<{
    instructionDiscriminator: number[];
}>;
export interface DelegateInstructionAccounts {
    payer: web3.PublicKey;
    entity: web3.PublicKey;
    account: web3.PublicKey;
    ownerProgram: web3.PublicKey;
    buffer?: web3.PublicKey;
    delegation_record?: web3.PublicKey;
    delegate_account_seeds?: web3.PublicKey;
    delegation_program?: web3.PublicKey;
    system_program?: web3.PublicKey;
}
export declare const delegateInstructionDiscriminator: number[];
export declare function createDelegateInstruction(accounts: DelegateInstructionAccounts, programId?: web3.PublicKey): web3.TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map