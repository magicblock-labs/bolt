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
exports.FindComponentPda =
  exports.FindEntityPda =
  exports.FindWorldPda =
  exports.FindWorldRegistryPda =
  exports.PROGRAM_ID =
  exports.PROGRAM_ADDRESS =
    void 0;
var web3_js_1 = require("@solana/web3.js");
__exportStar(require("./accounts"), exports);
__exportStar(require("./instructions"), exports);
exports.PROGRAM_ADDRESS = "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";
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
    [Buffer.from("world"), id.toBuffer("le", 8)],
    programId
  )[0];
}
exports.FindWorldPda = FindWorldPda;
function FindEntityPda(worldId, entityId, programId) {
  if (programId === void 0) {
    programId = new web3_js_1.PublicKey(exports.PROGRAM_ID);
  }
  return web3_js_1.PublicKey.findProgramAddressSync(
    [
      Buffer.from("entity"),
      worldId.toBuffer("be", 8),
      entityId.toBuffer("be", 8),
    ],
    programId
  )[0];
}
exports.FindEntityPda = FindEntityPda;
function FindComponentPda(componentProgramId, entity, componentId) {
  return web3_js_1.PublicKey.findProgramAddressSync(
    [Buffer.from(componentId), entity.toBytes()],
    componentProgramId
  )[0];
}
exports.FindComponentPda = FindComponentPda;
//# sourceMappingURL=index.js.map
