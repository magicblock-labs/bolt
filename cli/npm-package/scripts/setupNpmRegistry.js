const fs = require("fs");
const path = require("path");

// Configuration for both npm and Yarn
const npmrcPath = path.join(process.cwd(), ".npmrc");
const yarnrcPath = path.join(process.cwd(), ".yarnrc");
const npmConfigLine =
  "@magicblock-labs:registry=https://npm.pkg.github.com/magicblock-labs\n";
const yarnConfigLine =
  '"@magicblock-labs:registry" "https://npm.pkg.github.com/magicblock-labs"\n';

// Function to update or create a configuration file
function updateOrCreateConfig(filePath, configLine) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      if (!content.includes(configLine)) {
        fs.appendFileSync(filePath, configLine);
      }
    } else {
      fs.writeFileSync(filePath, configLine);
    }
    console.log(`${path.basename(filePath)} configured successfully.`);
  } catch (error) {
    console.error(`Error configuring ${path.basename(filePath)}:`, error);
  }
}

// Update or create both .npmrc and .yarnrc
updateOrCreateConfig(npmrcPath, npmConfigLine);
updateOrCreateConfig(yarnrcPath, yarnConfigLine);
