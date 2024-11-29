set -e
SCRIPT_DIR=$(dirname "$0")
PROJECT_DIR="$SCRIPT_DIR/.."
pushd "$PROJECT_DIR"
echo "### Checking formatting..."
cargo fmt -- --check --verbose

echo "### Checking clippy..."
cargo clippy -- --deny=warnings

echo "### Checking yarn lint..."
yarn lint
popd
