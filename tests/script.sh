#!/bin/bash

set -euo pipefail

echo "Waiting for 5 seconds..."
sleep 5

echo "Running TypeScript tests..."
yarn run ts-mocha -p ./tsconfig.json -t 1000000 clients/typescript/test/main.ts

echo "Running C# tests..."
cd clients/csharp/Solana.Unity.Bolt.Test
dotnet run --configuration Release

echo "Tests completed."
