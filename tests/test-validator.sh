#!/bin/bash

set -euo pipefail

echo "Starting validator"

solana-test-validator --reset \
  --bpf-program DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh tests/fixtures/delegation.so \
  --bpf-program KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5 tests/fixtures/session_keys.so \
  --bpf-program wor1DcaDr8AeBdaf5bqeBQUY9My2sgZwtanRcaALE9L target/deploy/world.so \
  --bpf-program CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua target/deploy/bolt_component.so \
  --bpf-program 7X4EFsDJ5aYTcEjKzJ94rD8FRKgQeXC89fkpeTS4KaqP target/deploy/bolt_system.so \
  --bpf-program Fn1JzzEdyb55fsyduWS94mYHizGhJZuhvjX6DVvrmGbQ target/deploy/position.so \
  --bpf-program 6LHhFVwif6N9Po3jHtSmMVtPjF6zRfL3xMosSzcrQAS8 target/deploy/system_apply_velocity.so \
  --bpf-program HT2YawJjkNmqWcLNfPAMvNsLdWwPvvvbKA5bpMw4eUpq target/deploy/system_fly.so \
  --bpf-program FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA target/deploy/system_simple_movement.so \
  --bpf-program CbHEFbSQdRN4Wnoby9r16umnJ1zWbULBHg4yqzGQonU1 target/deploy/velocity.so \
  --account EEmsg7GbxEAw5f9hGfZRmJRJ27HK8KeGDp7ViW9X2mYa tests/fixtures/commit_record.json \
  --account 7nQvHcfEqtFmY2q6hiQbidu8BCNdqegnEFfH7HkByFn5 tests/fixtures/committed_state.json \
  > /dev/null 2>&1 &

VALIDATOR_PID=$!

cleanup() {
  if ps -p $VALIDATOR_PID > /dev/null; then
    kill $VALIDATOR_PID
    wait $VALIDATOR_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

sleep 3

if ! solana airdrop -u http://localhost:8899 100000 ./tests/fixtures/provider.json; then
  echo "Error: Failed to airdrop SOL to provider account"
  exit 1
fi

anchor test --skip-build --skip-deploy --skip-local-validator

