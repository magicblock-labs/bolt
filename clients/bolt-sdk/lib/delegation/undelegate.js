"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUndelegateInstruction = exports.undelegateInstructionDiscriminator = exports.undelegateStruct = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
var accounts_1 = require("./accounts");
var web3_js_1 = require("@solana/web3.js");
exports.undelegateStruct = new beet.FixableBeetArgsStruct([["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]], "UndelegateInstructionArgs");
exports.undelegateInstructionDiscriminator = [3, 0, 0, 0, 0, 0, 0, 0];
function createUndelegateInstruction(accounts, programId) {
    var _a, _b, _c, _d, _e, _f;
    if (programId === void 0) { programId = new web3_js_1.PublicKey(accounts_1.DELEGATION_PROGRAM_ID); }
    var data = exports.undelegateStruct.serialize({
        instructionDiscriminator: exports.undelegateInstructionDiscriminator,
    })[0];
    var _g = (0, accounts_1.getDelegationAccounts)(accounts.delegatedAccount, accounts.ownerProgram, false), delegationPda = _g.delegationPda, delegatedAccountSeedsPda = _g.delegatedAccountSeedsPda, bufferPda = _g.bufferPda, commitStateRecordPda = _g.commitStateRecordPda, commitStatePda = _g.commitStatePda;
    var keys = [
        {
            pubkey: accounts.payer,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: accounts.delegatedAccount,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.ownerProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: (_a = accounts.buffer) !== null && _a !== void 0 ? _a : bufferPda,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: (_b = accounts.commitStatePda) !== null && _b !== void 0 ? _b : commitStatePda,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: (_c = accounts.commitStateRecordPda) !== null && _c !== void 0 ? _c : commitStateRecordPda,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: (_d = accounts.delegationRecord) !== null && _d !== void 0 ? _d : delegationPda,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: (_e = accounts.delegateAccountSeeds) !== null && _e !== void 0 ? _e : delegatedAccountSeedsPda,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.reimbursement,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: (_f = accounts.systemProgram) !== null && _f !== void 0 ? _f : web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
    ];
    return new web3.TransactionInstruction({
        programId: programId,
        keys: keys,
        data: data,
    });
}
exports.createUndelegateInstruction = createUndelegateInstruction;
//# sourceMappingURL=undelegate.js.map