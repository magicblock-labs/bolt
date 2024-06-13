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
exports.createApply4Instruction = exports.apply4InstructionDiscriminator = exports.apply4Struct = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
exports.apply4Struct = new beet.FixableBeetArgsStruct([
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["args", beet.bytes],
], "Apply4InstructionArgs");
exports.apply4InstructionDiscriminator = [
    223, 104, 24, 79, 252, 196, 14, 109,
];
function createApply4Instruction(accounts, args, programId) {
    if (programId === void 0) { programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"); }
    var data = exports.apply4Struct.serialize(__assign({ instructionDiscriminator: exports.apply4InstructionDiscriminator }, args))[0];
    var keys = [
        {
            pubkey: accounts.boltSystem,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.componentProgram1,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.boltComponent1,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.componentProgram2,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.boltComponent2,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.componentProgram3,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.boltComponent3,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.componentProgram4,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.boltComponent4,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.authority,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.instructionSysvarAccount,
            isWritable: false,
            isSigner: false,
        },
    ];
    if (accounts.anchorRemainingAccounts != null) {
        for (var _i = 0, _a = accounts.anchorRemainingAccounts; _i < _a.length; _i++) {
            var acc = _a[_i];
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
exports.createApply4Instruction = createApply4Instruction;
//# sourceMappingURL=apply4.js.map