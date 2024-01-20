"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.createAddEntityInstruction = exports.addEntityInstructionDiscriminator = exports.addEntityStruct = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
exports.addEntityStruct = new beet.FixableBeetArgsStruct([
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["extraSeed", beet.coption(beet.utf8String)],
], "AddEntityInstructionArgs");
exports.addEntityInstructionDiscriminator = [
    163, 241, 57, 35, 244, 244, 48, 57,
];
function createAddEntityInstruction(accounts, args, programId) {
    var _a;
    if (args === void 0) { args = { extraSeed: null }; }
    if (programId === void 0) { programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"); }
    var data = exports.addEntityStruct.serialize(__assign({ instructionDiscriminator: exports.addEntityInstructionDiscriminator }, args))[0];
    var keys = [
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.entity,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.world,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: (_a = accounts.systemProgram) !== null && _a !== void 0 ? _a : web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
    ];
    if (accounts.anchorRemainingAccounts != null) {
        for (var _i = 0, _b = accounts.anchorRemainingAccounts; _i < _b.length; _i++) {
            var acc = _b[_i];
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
exports.createAddEntityInstruction = createAddEntityInstruction;
//# sourceMappingURL=addEntity.js.map