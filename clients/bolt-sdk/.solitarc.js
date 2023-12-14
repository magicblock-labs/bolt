const path = require('path');
const programDir = path.join(__dirname, '../../', 'programs', 'world');
const idlDir = path.join(__dirname, 'idl');
const sdkDir = path.join(__dirname, 'src', 'generated');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
    idlGenerator: 'anchor',
    programName: 'world',
    programId: 'WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n',
    idlDir,
    sdkDir,
    binaryInstallDir,
    programDir,
};