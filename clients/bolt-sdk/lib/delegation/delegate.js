"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDelegateInstruction =
  exports.delegateInstructionDiscriminator =
  exports.delegateStruct =
    void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
var accounts_1 = require("./accounts");
exports.delegateStruct = new beet.FixableBeetArgsStruct(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["validUntil", beet.i64],
    ["commitFrequencyMs", beet.u32],
  ],
  "DelegateInstructionArgs"
);
exports.delegateInstructionDiscriminator = [90, 147, 75, 178, 85, 88, 4, 137];
function createDelegateInstruction(
  accounts,
  validUntil,
  commitFrequencyMs,
  programId
) {
  var _a, _b, _c, _d, _e;
  if (validUntil === void 0) {
    validUntil = 0;
  }
  if (commitFrequencyMs === void 0) {
    commitFrequencyMs = 30000;
  }
  if (programId === void 0) {
    programId = accounts.ownerProgram;
  }
  var data = exports.delegateStruct.serialize({
    instructionDiscriminator: exports.delegateInstructionDiscriminator,
    validUntil: validUntil,
    commitFrequencyMs: commitFrequencyMs,
  })[0];
  var _f = (0, accounts_1.getDelegationAccounts)(
      accounts.account,
      accounts.ownerProgram
    ),
    delegationPda = _f.delegationPda,
    delegatedAccountSeedsPda = _f.delegatedAccountSeedsPda,
    bufferPda = _f.bufferPda;
  var keys = [
    {
      pubkey: accounts.payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.entity,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.account,
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
      pubkey:
        (_b = accounts.delegationRecord) !== null && _b !== void 0
          ? _b
          : delegationPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey:
        (_c = accounts.delegateAccountSeeds) !== null && _c !== void 0
          ? _c
          : delegatedAccountSeedsPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey:
        (_d = accounts.delegationProgram) !== null && _d !== void 0
          ? _d
          : new web3.PublicKey(accounts_1.DELEGATION_PROGRAM_ID),
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey:
        (_e = accounts.systemProgram) !== null && _e !== void 0
          ? _e
          : web3.SystemProgram.programId,
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
exports.createDelegateInstruction = createDelegateInstruction;
//# sourceMappingURL=delegate.js.map
