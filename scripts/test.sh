set -e
SCRIPT_DIR=$(dirname "$0")
PROJECT_DIR="$SCRIPT_DIR/.."
pushd "$PROJECT_DIR"
cp tests/keys/* target/deploy/
bolt test
popd