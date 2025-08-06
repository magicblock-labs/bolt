import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID as WORLD_PROGRAM_ID } from "./generated";
import { World as WORLD_PROGRAM_IDL } from "./generated/types";
export { BN };
export * from "./generated/accounts";
export * from "./generated/instructions";
export * from "./world/transactions";
export * from "./delegation/delegate";
export * from "./delegation/undelegate";
export { DELEGATION_PROGRAM_ID } from "@magicblock-labs/ephemeral-rollups-sdk";

// Re-export anchor
import * as anchor from "@coral-xyz/anchor";
import { SessionProgram, Session } from "./session";
export { anchor };
export { Provider, Program, Wallet, web3, workspace } from "@coral-xyz/anchor";
export { WORLD_PROGRAM_ID, WORLD_PROGRAM_IDL };

export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111",
);

export function FindRegistryPda({ programId }: { programId?: PublicKey }) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId ?? WORLD_PROGRAM_ID,
  )[0];
}

export function FindWorldPda({
  worldId,
  programId,
}: {
  worldId: BN;
  programId?: PublicKey;
}) {
  const idBuffer = Buffer.from(worldId.toArrayLike(Buffer, "be", 8));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("world"), idBuffer],
    programId ?? WORLD_PROGRAM_ID,
  )[0];
}

export function FindEntityPda({
  worldId,
  entityId,
  seed,
  programId,
}: {
  worldId: BN;
  entityId?: BN;
  seed?: Uint8Array;
  programId?: PublicKey;
}) {
  const worldIdBuffer = Buffer.from(worldId.toArrayLike(Buffer, "be", 8));
  const seeds = [Buffer.from("entity"), worldIdBuffer];
  if (seed !== undefined) {
    seeds.push(Buffer.from(new Uint8Array(8)));
    seeds.push(Buffer.from(seed));
  } else if (entityId !== undefined) {
    const entityIdBuffer = Buffer.from(entityId.toArrayLike(Buffer, "be", 8));
    seeds.push(entityIdBuffer);
  } else {
    throw new Error("An entity must have either an Id or a Seed");
  }
  return PublicKey.findProgramAddressSync(
    seeds,
    programId ?? WORLD_PROGRAM_ID,
  )[0];
}

export function FindSessionTokenPda({
  sessionSigner,
  authority,
}: {
  sessionSigner: PublicKey;
  authority: PublicKey;
}) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("session_token"),
      WORLD_PROGRAM_ID.toBytes(),
      sessionSigner.toBytes(),
      authority.toBytes(),
    ],
    SessionProgram.programId,
  )[0];
}

export function FindComponentProgramDataPda({
  programId,
}: {
  programId: PublicKey;
}) {
  return PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
  )[0];
}

export function FindBufferPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("buffer")], // TODO: Everyone will share the same buffer. We need to optimize this to derive a different buffer for each user or transaction.
    WORLD_PROGRAM_ID,
  )[0];
}

// TODO: seed must be Uint8Array like the other FindPda functions
export function FindComponentPda({
  componentId,
  entity,
  seed,
}: {
  componentId: PublicKey;
  entity: PublicKey;
  seed?: string;
}) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(seed ?? ""), entity.toBytes()],
    componentId,
  )[0];
}

/**
 * Serialize arguments to a buffer
 * @param args
 * @constructor
 */
export function SerializeArgs(args: any = {}) {
  const jsonString = JSON.stringify(args);
  const encoder = new TextEncoder();
  const binaryData = encoder.encode(jsonString);
  return Buffer.from(
    binaryData.buffer,
    binaryData.byteOffset,
    binaryData.byteLength,
  );
}

export { SessionProgram, Session };
