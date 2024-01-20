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
exports.createInitializeComponentInstruction =
  exports.initializeComponentInstructionDiscriminator =
  exports.initializeComponentStruct =
    void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
exports.initializeComponentStruct = new beet.BeetArgsStruct(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "InitializeComponentInstructionArgs"
);
exports.initializeComponentInstructionDiscriminator = [
  36, 143, 233, 113, 12, 234, 61, 30,
];
function createInitializeComponentInstruction(accounts, programId) {
  var _a;
  if (programId === void 0) {
    programId = new web3.PublicKey(
      "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"
    );
  }
  var data = exports.initializeComponentStruct.serialize({
    instructionDiscriminator:
      exports.initializeComponentInstructionDiscriminator,
  })[0];
  var keys = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.data,
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
      pubkey:
        (_a = accounts.systemProgram) !== null && _a !== void 0
          ? _a
          : web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (
      var _i = 0, _b = accounts.anchorRemainingAccounts;
      _i < _b.length;
      _i++
    ) {
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
exports.createInitializeComponentInstruction =
  createInitializeComponentInstruction;
//# sourceMappingURL=initializeComponent.js.map
