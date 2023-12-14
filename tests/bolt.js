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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const chai_1 = require("chai");
const bn_js_1 = __importDefault(require("bn.js"));
var Direction;
(function (Direction) {
  Direction["Left"] = "Left";
  Direction["Right"] = "Right";
  Direction["Up"] = "Up";
  Direction["Down"] = "Down";
})(Direction || (Direction = {}));
function serializeArgs(args = {}) {
  const jsonString = JSON.stringify(args);
  const encoder = new TextEncoder();
  const binaryData = encoder.encode(jsonString);
  return Buffer.from(
    binaryData.buffer,
    binaryData.byteOffset,
    binaryData.byteLength
  );
}
describe("bolt", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const worldProgram = anchor.workspace.World;
  const boltComponentPositionProgram = anchor.workspace.ComponentPosition;
  const boltComponentVelocityProgram = anchor.workspace.ComponentVelocity;
  const boltComponentProgramOrigin = anchor.workspace.BoltComponent;
  const systemSimpleMovement = anchor.workspace.SystemSimpleMovement.programId;
  const systemFly = anchor.workspace.SystemFly.programId;
  const applyVelocity = anchor.workspace.SystemApplyVelocity.programId;
  let entity1;
  let entity2;
  let componentPositionEntity1;
  let componentPositionEntity2;
  let componentVelocityEntity1;
  it("InitializeWorldsRegistry", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const registryPda = FindWorldRegistryPda(worldProgram);
      yield worldProgram.methods
        .initializeRegistry()
        .accounts({
          registry: registryPda,
          payer: provider.wallet.publicKey,
        })
        .rpc();
    }));
  it("InitializeNewWorld", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const registryPda = FindWorldRegistryPda(worldProgram);
      const worldPda = FindWorldPda(worldProgram, new bn_js_1.default(0));
      yield worldProgram.methods
        .initializeNewWorld()
        .accounts({
          world: worldPda,
          registry: registryPda,
          payer: provider.wallet.publicKey,
        })
        .rpc();
    }));
  it("Add entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const worldPda = FindWorldPda(worldProgram, new bn_js_1.default(0));
      entity1 = FindEntityPda(
        worldProgram,
        new bn_js_1.default(0),
        new bn_js_1.default(0)
      );
      yield worldProgram.methods
        .addEntity()
        .accounts({
          world: worldPda,
          entity: entity1,
          payer: provider.wallet.publicKey,
        })
        .rpc();
    }));
  it("Add entity 2", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const worldPda = FindWorldPda(worldProgram, new bn_js_1.default(0));
      entity2 = FindEntityPda(
        worldProgram,
        new bn_js_1.default(0),
        new bn_js_1.default(1)
      );
      yield worldProgram.methods
        .addEntity()
        .accounts({
          world: worldPda,
          entity: entity2,
          payer: provider.wallet.publicKey,
        })
        .rpc();
    }));
  it("Add entity 3", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const worldPda = FindWorldPda(worldProgram, new bn_js_1.default(0));
      const entityPda = FindEntityPda(
        worldProgram,
        new bn_js_1.default(0),
        new bn_js_1.default(2)
      );
      yield worldProgram.methods
        .addEntity()
        .accounts({
          world: worldPda,
          entity: entityPda,
          payer: provider.wallet.publicKey,
        })
        .rpc();
    }));
  it("Initialize Original Component on Entity 1, trough the world instance", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      let componentEntity1 = FindComponentPda(
        boltComponentProgramOrigin.programId,
        entity1,
        "origin-component"
      );
      yield worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentEntity1,
          componentProgram: boltComponentProgramOrigin.programId,
          entity: entity1,
        })
        .rpc();
    }));
  it("Initialize Original Component on Entity 2, trough the world instance", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      let componentEntity2 = FindComponentPda(
        boltComponentProgramOrigin.programId,
        entity2,
        "origin-component"
      );
      yield worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentEntity2,
          componentProgram: boltComponentProgramOrigin.programId,
          entity: entity2,
        })
        .rpc();
    }));
  it("Initialize Position Component on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      componentPositionEntity1 = FindComponentPda(
        boltComponentPositionProgram.programId,
        entity1,
        "component-position"
      );
      console.log(
        "Component Position E1: ",
        componentPositionEntity1.toBase58()
      );
      yield worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentPositionEntity1,
          componentProgram: boltComponentPositionProgram.programId,
          entity: entity1,
        })
        .rpc();
    }));
  it("Initialize Velocity Component on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      componentVelocityEntity1 = FindComponentPda(
        boltComponentVelocityProgram.programId,
        entity1,
        "component-velocity"
      );
      yield worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentVelocityEntity1,
          componentProgram: boltComponentVelocityProgram.programId,
          entity: entity1,
        })
        .rpc();
    }));
  it("Initialize Position Component on Entity 2", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      componentPositionEntity2 = FindComponentPda(
        boltComponentPositionProgram.programId,
        entity2,
        "component-position"
      );
      yield worldProgram.methods
        .initializeComponent()
        .accounts({
          payer: provider.wallet.publicKey,
          data: componentPositionEntity2,
          componentProgram: boltComponentPositionProgram.programId,
          entity: entity2,
        })
        .rpc();
    }));
  it("Check Position on Entity 1 is default", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).x.toNumber()
      ).to.equal(0);
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).y.toNumber()
      ).to.equal(0);
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).z.toNumber()
      ).to.equal(0);
    }));
  it("Simple Movement System and Up direction on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const args = {
        direction: Direction.Up,
      };
      yield worldProgram.methods
        .apply(serializeArgs(args)) // Move Up
        .accounts({
          componentProgram: boltComponentPositionProgram.programId,
          boltSystem: systemSimpleMovement,
          boltComponent: componentPositionEntity1,
        })
        .rpc({ skipPreflight: true });
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).y.toNumber()
      ).to.equal(1);
      const componentData =
        yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        );
      const x = componentData.x.toNumber();
      const y = componentData.y.toNumber();
      const z = componentData.z.toNumber();
      console.log("+-----------------------------+");
      console.log("| Movement System:   Entity 1 |");
      console.log("+----------------+------------+");
      console.log("| Coordinate    | Value      |");
      console.log("+----------------+------------+");
      console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
      console.log("+----------------+------------+");
      console.log("|                             |");
      console.log("+-----------------------------+");
    }));
  it("Simple Movement System and Right direction on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      const args = {
        direction: Direction.Right,
      };
      yield worldProgram.methods
        .apply(serializeArgs(args)) // Move Right
        .accounts({
          componentProgram: boltComponentPositionProgram.programId,
          boltSystem: systemSimpleMovement,
          boltComponent: componentPositionEntity1,
        })
        .rpc({ skipPreflight: true });
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).y.toNumber()
      ).to.equal(1);
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).y.toNumber()
      ).to.equal(1);
      const componentData =
        yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        );
      const x = componentData.x.toNumber();
      const y = componentData.y.toNumber();
      const z = componentData.z.toNumber();
      console.log("+-----------------------------+");
      console.log("| Movement System:   Entity 1 |");
      console.log("+----------------+------------+");
      console.log("| Coordinate    | Value      |");
      console.log("+----------------+------------+");
      console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
      console.log("+----------------+------------+");
      console.log("|                             |");
      console.log("+-----------------------------+");
    }));
  it("Fly System on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      yield worldProgram.methods
        .apply(Buffer.alloc(0)) // Move Up
        .accounts({
          componentProgram: boltComponentPositionProgram.programId,
          boltSystem: systemFly,
          boltComponent: componentPositionEntity1,
        })
        .rpc();
      (0, chai_1.expect)(
        (yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        )).z.toNumber()
      ).to.equal(1);
      const componentData =
        yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        );
      const x = componentData.x.toNumber();
      const y = componentData.y.toNumber();
      const z = componentData.z.toNumber();
      console.log("+-----------------------------+");
      console.log("| Fly: Position Entity 1      |");
      console.log("+----------------+------------+");
      console.log("| Coordinate    | Value      |");
      console.log("+----------------+------------+");
      console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
      console.log("+----------------+------------+");
      console.log("|                             |");
      console.log("+-----------------------------+");
    }));
  it("Apply Velocity on Entity 1", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      yield worldProgram.methods
        .apply2(Buffer.alloc(0))
        .accounts({
          componentProgram1: boltComponentVelocityProgram.programId,
          componentProgram2: boltComponentPositionProgram.programId,
          boltSystem: applyVelocity,
          boltComponent1: componentVelocityEntity1,
          boltComponent2: componentPositionEntity1,
        })
        .remainingAccounts([
          {
            pubkey: componentPositionEntity1,
            isWritable: false,
            isSigner: false,
          },
        ])
        .rpc();
      console.log("Component Velocity: ", componentVelocityEntity1.toBase58());
      let componentData =
        yield boltComponentVelocityProgram.account.velocity.fetch(
          componentVelocityEntity1
        );
      let x = componentData.x.toNumber();
      let y = componentData.y.toNumber();
      let z = componentData.z.toNumber();
      const tmp = componentData.lastApplied.toNumber();
      console.log("+-----------------------------+");
      console.log("| Apply Velocity: Velocity Entity 1      |");
      console.log("+----------------+------------+");
      console.log("| Coordinate    | Value      |");
      console.log("+----------------+------------+");
      console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Timestamp    | ${String(tmp).padEnd(10, " ")} |`);
      console.log("+----------------+------------+");
      console.log("|                             |");
      console.log("+-----------------------------+");
      let positionData =
        yield boltComponentPositionProgram.account.position.fetch(
          componentPositionEntity1
        );
      x = positionData.x.toNumber();
      y = positionData.y.toNumber();
      z = positionData.z.toNumber();
      console.log("+-----------------------------+");
      console.log("| Apply Velocity: Position Entity 1      |");
      console.log("+----------------+------------+");
      console.log("| Coordinate    | Value      |");
      console.log("+----------------+------------+");
      console.log(`| X Position    | ${String(x).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Y Position    | ${String(y).padEnd(10, " ")} |`);
      console.log("|               |            |");
      console.log(`| Z Position    | ${String(z).padEnd(10, " ")} |`);
      console.log("+----------------+------------+");
      console.log("|                             |");
      console.log("+-----------------------------+");
    }));
  // Utils
  function FindWorldRegistryPda(program) {
    return web3_js_1.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    )[0];
  }
  function FindWorldPda(program, id) {
    return web3_js_1.PublicKey.findProgramAddressSync(
      [Buffer.from("world"), id.toBuffer("le", 8)],
      program.programId
    )[0];
  }
  function FindEntityPda(program, worldId, entityId) {
    return web3_js_1.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entity"),
        worldId.toBuffer("be", 8),
        entityId.toBuffer("be", 8),
      ],
      program.programId
    )[0];
  }
  function FindComponentPda(program, entity, seed = "component") {
    return web3_js_1.PublicKey.findProgramAddressSync(
      [Buffer.from(seed), entity.toBytes()],
      program
    )[0];
  }
});
