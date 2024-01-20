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
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldBeet = exports.World = exports.worldDiscriminator = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
var beetSolana = __importStar(require("@metaplex-foundation/beet-solana"));
exports.worldDiscriminator = [145, 45, 170, 174, 122, 32, 155, 124];
var World = (function () {
    function World(id, entities) {
        this.id = id;
        this.entities = entities;
    }
    World.fromArgs = function (args) {
        return new World(args.id, args.entities);
    };
    World.fromAccountInfo = function (accountInfo, offset) {
        if (offset === void 0) { offset = 0; }
        return World.deserialize(accountInfo.data, offset);
    };
    World.fromAccountAddress = function (connection, address, commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var accountInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, connection.getAccountInfo(address, commitmentOrConfig)];
                    case 1:
                        accountInfo = _a.sent();
                        if (accountInfo == null) {
                            throw new Error("Unable to find World account at ".concat(address));
                        }
                        return [2, World.fromAccountInfo(accountInfo, 0)[0]];
                }
            });
        });
    };
    World.gpaBuilder = function (programId) {
        if (programId === void 0) { programId = new web3.PublicKey("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n"); }
        return beetSolana.GpaBuilder.fromStruct(programId, exports.worldBeet);
    };
    World.deserialize = function (buf, offset) {
        if (offset === void 0) { offset = 0; }
        return exports.worldBeet.deserialize(buf, offset);
    };
    World.prototype.serialize = function () {
        return exports.worldBeet.serialize(__assign({ accountDiscriminator: exports.worldDiscriminator }, this));
    };
    Object.defineProperty(World, "byteSize", {
        get: function () {
            return exports.worldBeet.byteSize;
        },
        enumerable: false,
        configurable: true
    });
    World.getMinimumBalanceForRentExemption = function (connection, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, connection.getMinimumBalanceForRentExemption(World.byteSize, commitment)];
            });
        });
    };
    World.hasCorrectByteSize = function (buf, offset) {
        if (offset === void 0) { offset = 0; }
        return buf.byteLength - offset === World.byteSize;
    };
    World.prototype.pretty = function () {
        var _this = this;
        return {
            id: (function () {
                var x = _this.id;
                if (typeof x.toNumber === "function") {
                    try {
                        return x.toNumber();
                    }
                    catch (_) {
                        return x;
                    }
                }
                return x;
            })(),
            entities: (function () {
                var x = _this.entities;
                if (typeof x.toNumber === "function") {
                    try {
                        return x.toNumber();
                    }
                    catch (_) {
                        return x;
                    }
                }
                return x;
            })(),
        };
    };
    return World;
}());
exports.World = World;
exports.worldBeet = new beet.BeetStruct([
    ["accountDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["id", beet.u64],
    ["entities", beet.u64],
], World.fromArgs, "World");
//# sourceMappingURL=World.js.map