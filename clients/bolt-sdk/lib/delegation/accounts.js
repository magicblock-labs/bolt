"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDelegationAccounts = exports.DELEGATION_PROGRAM_ID = void 0;
var web3_js_1 = require("@solana/web3.js");
var SEED_BUFFER_PDA = "buffer";
var SEED_DELEGATION_PDA = "delegation";
var DELEGATED_ACCOUNT_SEEDS = "account-seeds";
var SEED_COMMIT_STATE_RECORD_PDA = "commit-state-record";
var SEED_STATE_DIFF_PDA = "state-diff";
exports.DELEGATION_PROGRAM_ID = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
function getDelegationAccounts(accountToDelegate, ownerProgram, ownedBuffer) {
    if (ownedBuffer === void 0) { ownedBuffer = true; }
    var pdaBytes = accountToDelegate.toBytes();
    var delegationPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(SEED_DELEGATION_PDA), pdaBytes], new web3_js_1.PublicKey(exports.DELEGATION_PROGRAM_ID))[0];
    var delegatedAccountSeedsPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(DELEGATED_ACCOUNT_SEEDS), pdaBytes], new web3_js_1.PublicKey(exports.DELEGATION_PROGRAM_ID))[0];
    var bufferPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(SEED_BUFFER_PDA), pdaBytes], ownedBuffer
        ? new web3_js_1.PublicKey(ownerProgram)
        : new web3_js_1.PublicKey(exports.DELEGATION_PROGRAM_ID))[0];
    var commitStateRecordPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(SEED_COMMIT_STATE_RECORD_PDA), pdaBytes], new web3_js_1.PublicKey(exports.DELEGATION_PROGRAM_ID))[0];
    var commitStatePda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(SEED_STATE_DIFF_PDA), pdaBytes], new web3_js_1.PublicKey(exports.DELEGATION_PROGRAM_ID))[0];
    return {
        delegationPda: delegationPda,
        delegatedAccountSeedsPda: delegatedAccountSeedsPda,
        bufferPda: bufferPda,
        commitStateRecordPda: commitStateRecordPda,
        commitStatePda: commitStatePda,
    };
}
exports.getDelegationAccounts = getDelegationAccounts;
//# sourceMappingURL=accounts.js.map