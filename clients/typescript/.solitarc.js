const path = require("path");
const programDir = path.join(__dirname, "../../", "programs", "world");
const idlDir = path.join(__dirname, "idl");
const sdkDir = path.join(__dirname, "src", "generated");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "world",
  programId: "wor1DcaDr8AeBdaf5bqeBQUY9My2sgZwtanRcaALE9L",
  removeExistingIdl: false,
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
