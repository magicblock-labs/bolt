"use strict";
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null"
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorFromName =
  exports.errorFromCode =
  exports.InvalidAuthorityError =
    void 0;
var createErrorFromCodeLookup = new Map();
var createErrorFromNameLookup = new Map();
var InvalidAuthorityError = (function (_super) {
  __extends(InvalidAuthorityError, _super);
  function InvalidAuthorityError() {
    var _this = _super.call(this, "Invalid authority for instruction") || this;
    _this.code = 0x1770;
    _this.name = "InvalidAuthority";
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(_this, InvalidAuthorityError);
    }
    return _this;
  }
  return InvalidAuthorityError;
})(Error);
exports.InvalidAuthorityError = InvalidAuthorityError;
createErrorFromCodeLookup.set(0x1770, function () {
  return new InvalidAuthorityError();
});
createErrorFromNameLookup.set("InvalidAuthority", function () {
  return new InvalidAuthorityError();
});
function errorFromCode(code) {
  var createError = createErrorFromCodeLookup.get(code);
  return createError != null ? createError() : null;
}
exports.errorFromCode = errorFromCode;
function errorFromName(name) {
  var createError = createErrorFromNameLookup.get(name);
  return createError != null ? createError() : null;
}
exports.errorFromName = errorFromName;
//# sourceMappingURL=index.js.map
