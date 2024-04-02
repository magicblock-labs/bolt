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
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeArgs =
  exports.FindComponentPda =
  exports.FindEntityPda =
  exports.FindWorldPda =
  exports.FindWorldRegistryPda =
  exports.PROGRAM_ID =
  exports.SYSVAR_INSTRUCTIONS_PUBKEY =
  exports.PROGRAM_ADDRESS =
    void 0;
var web3_js_1 = require("@solana/web3.js");
__exportStar(require("./accounts"), exports);
__exportStar(require("./instructions"), exports);
__exportStar(require("./transactions/transactions"), exports);
exports.PROGRAM_ADDRESS = "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";
exports.SYSVAR_INSTRUCTIONS_PUBKEY = new web3_js_1.PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);
exports.PROGRAM_ID = new web3_js_1.PublicKey(exports.PROGRAM_ADDRESS);
function FindWorldRegistryPda(programId) {
  if (programId === void 0) {
    programId = new web3_js_1.PublicKey(exports.PROGRAM_ID);
  }
  return web3_js_1.PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId
  )[0];
}
exports.FindWorldRegistryPda = FindWorldRegistryPda;
function FindWorldPda(id, programId) {
  if (programId === void 0) {
    programId = new web3_js_1.PublicKey(exports.PROGRAM_ID);
  }
  return web3_js_1.PublicKey.findProgramAddressSync(
    [Buffer.from("world"), id.toBuffer("be", 8)],
    programId
  )[0];
}
exports.FindWorldPda = FindWorldPda;
function FindEntityPda(worldId, entityId, extraSeed, programId) {
  if (programId === void 0) {
    programId = new web3_js_1.PublicKey(exports.PROGRAM_ID);
  }
  var seeds = [Buffer.from("entity"), worldId.toBuffer("be", 8)];
  if (extraSeed != null) {
    seeds.push(Buffer.from(new Uint8Array(8)));
    seeds.push(Buffer.from(extraSeed));
  } else {
    seeds.push(entityId.toBuffer("be", 8));
  }
  return web3_js_1.PublicKey.findProgramAddressSync(seeds, programId)[0];
}
exports.FindEntityPda = FindEntityPda;
function FindComponentPda(componentProgramId, entity, componentId) {
  if (componentId === void 0) {
    componentId = "";
  }
  return web3_js_1.PublicKey.findProgramAddressSync(
    [Buffer.from(componentId), entity.toBytes()],
    componentProgramId
  )[0];
}
exports.FindComponentPda = FindComponentPda;
function SerializeArgs(args) {
  if (args === void 0) {
    args = {};
  }
  var jsonString = JSON.stringify(args);
  var encoder = new TextEncoder();
  var binaryData = encoder.encode(jsonString);
  return Buffer.from(
    binaryData.buffer,
    binaryData.byteOffset,
    binaryData.byteLength
  );
}
exports.SerializeArgs = SerializeArgs;
//# sourceMappingURL=index.js.map
