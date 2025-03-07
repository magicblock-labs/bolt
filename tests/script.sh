#!/bin/bash

# Function to clean up on exit
cleanup() {
    pkill -f ephemeral-validator || true
}

cleanup

# Trap Ctrl-C (SIGINT) and call cleanup function
trap cleanup EXIT

echo "Waiting for 5 seconds..."
sleep 5

echo "Starting ephemeral validator..."
yarn run ephemeral-validator tests/ephem-localnet.toml &

echo "Waiting for 5 seconds..."
sleep 5

echo "Running TypeScript tests..."
yarn run ts-mocha -p ./tsconfig.json -t 1000000 clients/typescript/test/main.ts

echo "Running C# tests..."
cd clients/csharp/Solana.Unity.Bolt.Test
dotnet run --configuration Release

echo "Tests completed."

# Explicit cleanup in case script reaches the end
cleanup