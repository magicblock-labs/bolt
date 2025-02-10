#!/bin/bash

set -e

# Step 1: Read the version from Cargo.toml
version=$(grep '^version = ' Cargo.toml | head -n 1 | sed 's/version = "\(.*\)"/\1/')

if [ -z "$version" ]; then
    echo "Version not found in Cargo.toml"
    exit 1
fi

echo "Aligning for version: $version"

# GNU/BSD compat
sedi=(-i'')
case "$(uname)" in
  # For macOS, use two parameters
  Darwin*) sedi=(-i '')
esac

# Update the version for all crates in the Cargo.toml workspace.dependencies section
sed "${sedi[@]}" "/\[workspace.dependencies\]/,/\## External crates/s/version = \"=.*\"/version = \"=$version\"/" Cargo.toml

# Update the version in clients/typescript/bolt-sdk/package.json
jq --arg version "$version" '.version = $version' clients/typescript/bolt-sdk/package.json > temp.json && mv temp.json clients/typescript/bolt-sdk/package.json

# Update the version in crates/bolt-cli/npm-package/package.json.tmpl
jq --arg version "$version" '.version = $version' crates/bolt-cli/npm-package/package.json.tmpl > temp.json && mv temp.json crates/bolt-cli/npm-package/package.json.tmpl

# Update the main package version and all optionalDependencies versions in crates/bolt-cli/npm-package/package.json
jq --arg version "$version" '(.version = $version) | (.optionalDependencies[] = $version)' crates/bolt-cli/npm-package/package.json > temp.json && mv temp.json crates/bolt-cli/npm-package/package.json

# Potential for collisions in Cargo.lock, use cargo update to update it
cargo update --workspace

# Generate CHANGELOG.md
git-cliff -c Cliff.toml -o docs/CHANGELOG.md -t $version

# Check if the any changes have been made to the specified files, if running with --check
if [[ "$1" == "--check" ]]; then
    files_to_check=(
        "clients/typescript/bolt-sdk/package.json"
        "crates/bolt-cli/npm-package/package.json.tmpl"
        "crates/bolt-cli/npm-package/package.json"
        "Cargo.toml"
        "CHANGELOG.toml"
    )

    for file in "${files_to_check[@]}"; do
        # Check if the file has changed from the previous commit
        if git diff --name-only | grep -q "$file"; then
            echo "Error: version not aligned for $file. Align the version, commit and try again."
            exit 1
        fi
    done
    exit 0
fi