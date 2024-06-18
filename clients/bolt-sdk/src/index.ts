import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import { PROGRAM_ID } from "./generated";
export * from "./generated/accounts";
export * from "./generated/instructions";
export * from "./world/transactions";
export * from "./delegation/accounts";
export * from "./delegation/delegate";
export * from "./delegation/undelegate";

export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);

export function FindRegistryPda({ programId }: { programId?: PublicKey }) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId ?? PROGRAM_ID
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
    programId ?? PROGRAM_ID
  )[0];
}

export function FindEntityPda({
  world,
  seed,
  entityId,
  programId,
}: {
  world: PublicKey;
  seed?: string;
  entityId?: BN;
  programId?: PublicKey;
}) {
  const seeds = [Buffer.from("entity"), world.toBytes()];
  if (seed !== undefined) {
    seeds.push(Buffer.from(new Uint8Array(8)));
    seeds.push(Buffer.from(seed));
  } else if (entityId !== undefined) {
    const entityIdBuffer = entityId.toArrayLike(Buffer, "be", 8);
    seeds.push(entityIdBuffer);
  } else {
    throw new Error("An entity must have either an Id or a Seed");
  }
  return PublicKey.findProgramAddressSync(seeds, programId ?? PROGRAM_ID)[0];
}

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
    componentId
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
    binaryData.byteLength
  );
}
