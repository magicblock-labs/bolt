"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplySystem = exports.InitializeComponent = exports.AddEntity = exports.InitializeNewWorld = void 0;
var index_1 = require("../index");
var bn_js_1 = __importDefault(require("bn.js"));
var web3_js_1 = require("@solana/web3.js");
var generated_1 = require("generated");
var MAX_COMPONENTS = 5;
function InitializeNewWorld(_a) {
    var payer = _a.payer, connection = _a.connection;
    return __awaiter(this, void 0, void 0, function () {
        var registryPda, registry, worldId, worldPda, initializeWorldIx;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    registryPda = (0, index_1.FindWorldRegistryPda)();
                    return [4, index_1.Registry.fromAccountAddress(connection, registryPda)];
                case 1:
                    registry = _b.sent();
                    worldId = new bn_js_1.default(registry.worlds);
                    worldPda = (0, index_1.FindWorldPda)(new bn_js_1.default(worldId));
                    initializeWorldIx = (0, index_1.createInitializeNewWorldInstruction)({
                        world: worldPda,
                        registry: registryPda,
                        payer: payer,
                    });
                    return [2, {
                            transaction: new web3_js_1.Transaction().add(initializeWorldIx),
                            worldPda: worldPda,
                            worldId: worldId,
                        }];
            }
        });
    });
}
exports.InitializeNewWorld = InitializeNewWorld;
function AddEntity(_a) {
    var payer = _a.payer, world = _a.world, seed = _a.seed, connection = _a.connection;
    return __awaiter(this, void 0, void 0, function () {
        var worldInstance, entityId, entityPda, createEntityIx;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, index_1.World.fromAccountAddress(connection, world)];
                case 1:
                    worldInstance = _b.sent();
                    entityId = new bn_js_1.default(worldInstance.entities);
                    entityPda = (0, index_1.FindEntityPda)(new bn_js_1.default(worldInstance.id), entityId);
                    createEntityIx = (0, index_1.createAddEntityInstruction)({
                        world: world,
                        payer: payer,
                        entity: entityPda,
                    }, { extraSeed: seed !== null && seed !== void 0 ? seed : null });
                    return [2, {
                            transaction: new web3_js_1.Transaction().add(createEntityIx),
                            entityPda: entityPda,
                            entityId: entityId,
                        }];
            }
        });
    });
}
exports.AddEntity = AddEntity;
function InitializeComponent(_a) {
    var payer = _a.payer, entity = _a.entity, componentId = _a.componentId, _b = _a.seed, seed = _b === void 0 ? "" : _b, authority = _a.authority, anchorRemainingAccounts = _a.anchorRemainingAccounts;
    return __awaiter(this, void 0, void 0, function () {
        var componentPda, initComponentIx;
        return __generator(this, function (_c) {
            componentPda = (0, index_1.FindComponentPda)(componentId, entity, seed);
            initComponentIx = (0, index_1.createInitializeComponentInstruction)({
                payer: payer,
                entity: entity,
                data: componentPda,
                componentProgram: componentId,
                authority: authority !== null && authority !== void 0 ? authority : generated_1.PROGRAM_ID,
                instructionSysvarAccount: index_1.SYSVAR_INSTRUCTIONS_PUBKEY,
                anchorRemainingAccounts: anchorRemainingAccounts,
            });
            return [2, {
                    transaction: new web3_js_1.Transaction().add(initComponentIx),
                    componentPda: componentPda,
                }];
        });
    });
}
exports.InitializeComponent = InitializeComponent;
function getApplyInstructionFunctionName(componentsCount) {
    if (componentsCount === 1)
        return "createApplyInstruction";
    return "createApply".concat(componentsCount, "Instruction");
}
function getBoltComponentName(index, componentsCount) {
    if (componentsCount === 1)
        return "boltComponent";
    return "boltComponent".concat(index + 1);
}
function getBoltComponentProgramName(index, componentsCount) {
    if (componentsCount === 1)
        return "componentProgram";
    return "componentProgram".concat(index + 1);
}
function createApplySystemInstruction(_a) {
    var authority = _a.authority, systemId = _a.systemId, entities = _a.entities, extraAccounts = _a.extraAccounts, args = _a.args;
    var componentCount = 0;
    entities.forEach(function (entity) {
        componentCount += entity.components.length;
    });
    if (componentCount <= 0) {
        throw new Error("No components provided");
    }
    if (componentCount > MAX_COMPONENTS) {
        throw new Error("Not implemented for component counts outside 1-".concat(MAX_COMPONENTS));
    }
    var instructionArgs = {
        authority: authority,
        boltSystem: systemId,
        instructionSysvarAccount: index_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        anchorRemainingAccounts: extraAccounts,
    };
    entities.forEach(function (entity) {
        entity.components.forEach(function (component) {
            var _a;
            var componentPda = (0, index_1.FindComponentPda)(component.id, entity.entity, (_a = component.seed) !== null && _a !== void 0 ? _a : "");
            instructionArgs[getBoltComponentProgramName(componentCount, componentCount)] = component.id;
            instructionArgs[getBoltComponentName(componentCount, componentCount)] =
                componentPda;
        });
    });
    var instructionFunctions = {
        createApplyInstruction: index_1.createApplyInstruction,
        createApply2Instruction: index_1.createApply2Instruction,
        createApply3Instruction: index_1.createApply3Instruction,
        createApply4Instruction: index_1.createApply4Instruction,
        createApply5Instruction: index_1.createApply5Instruction,
    };
    var functionName = getApplyInstructionFunctionName(componentCount);
    return instructionFunctions[functionName](instructionArgs, {
        args: (0, index_1.SerializeArgs)(args),
    });
}
function ApplySystem(_a) {
    var authority = _a.authority, systemId = _a.systemId, entities = _a.entities, extraAccounts = _a.extraAccounts, _b = _a.args, args = _b === void 0 ? {} : _b;
    return __awaiter(this, void 0, void 0, function () {
        var applySystemIx;
        return __generator(this, function (_c) {
            applySystemIx = createApplySystemInstruction({
                authority: authority,
                systemId: systemId,
                entities: entities,
                extraAccounts: extraAccounts,
                args: args,
            });
            return [2, {
                    transaction: new web3_js_1.Transaction().add(applySystemIx),
                }];
        });
    });
}
exports.ApplySystem = ApplySystem;
//# sourceMappingURL=transactions.js.map