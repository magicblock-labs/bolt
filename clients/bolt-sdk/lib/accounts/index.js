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
exports.accountProviders = void 0;
var Entity_1 = require("./Entity");
var Registry_1 = require("./Registry");
var World_1 = require("./World");
__exportStar(require("./Entity"), exports);
__exportStar(require("./Registry"), exports);
__exportStar(require("./World"), exports);
exports.accountProviders = {
  Entity: Entity_1.Entity,
  Registry: Registry_1.Registry,
  World: World_1.World,
};
//# sourceMappingURL=index.js.map
