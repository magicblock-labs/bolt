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
exports.createInitializeComponentInstruction = exports.initializeComponentInstructionDiscriminator = exports.initializeComponentStruct = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
var index_1 = require("../index");
exports.initializeComponentStruct = new beet.BeetArgsStruct([["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]], "InitializeComponentInstructionArgs");
exports.initializeComponentInstructionDiscriminator = [
    36, 143, 233, 113, 12, 234, 61, 30,
];
function createInitializeComponentInstruction(accounts, programId) {
    var _a, _b, _c, _d;
    if (programId === void 0) { programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"); }
    var data = exports.initializeComponentStruct.serialize({
        instructionDiscriminator: exports.initializeComponentInstructionDiscriminator,
    })[0];
    var keys = [
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: (_a = accounts.data) !== null && _a !== void 0 ? _a : (0, index_1.FindComponentPda)(accounts.componentProgram, accounts.entity),
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.entity,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.componentProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: (_b = accounts.authority) !== null && _b !== void 0 ? _b : programId,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: (_c = accounts.instructionSysvarAccount) !== null && _c !== void 0 ? _c : index_1.SYSVAR_INSTRUCTIONS_PUBKEY,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: (_d = accounts.systemProgram) !== null && _d !== void 0 ? _d : web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
    ];
    if (accounts.anchorRemainingAccounts != null) {
        for (var _i = 0, _e = accounts.anchorRemainingAccounts; _i < _e.length; _i++) {
            var acc = _e[_i];
            keys.push(acc);
        }
    }
    var ix = new web3.TransactionInstruction({
        programId: programId,
        keys: keys,
        data: data,
    });
    return ix;
}
exports.createInitializeComponentInstruction = createInitializeComponentInstruction;
//# sourceMappingURL=initializeComponent.js.map