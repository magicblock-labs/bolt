set -e
SCRIPT_DIR=$(dirname "$0")
PROJECT_DIR="$SCRIPT_DIR/.."
pushd "$PROJECT_DIR"
echo "### Checking formatting..."
cargo fmt -- --verbose

echo "### Checking clippy..."
cargo clippy --fix -- --deny=warnings

echo "### Checking yarn lint..."
yarn lint --write
popd
