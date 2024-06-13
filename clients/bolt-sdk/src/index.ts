import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "generated";
export * from "./generated/accounts";
export * from "./generated/instructions";
export * from "./world/transactions";
export * from "./delegation/accounts";
export * from "./delegation/delegate";

export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);

export function FindWorldRegistryPda(
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId
  )[0];
}

export function FindWorldPda(
  id: BN | string | number | Uint8Array,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  id = CastToBN(id);
  const idBuffer = Buffer.from(id.toArrayLike(Buffer, "be", 8));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("world"), idBuffer],
    programId
  )[0];
}

export function FindEntityPda(
  worldId: BN | string | number | Uint8Array,
  entityId: BN | string | number | Uint8Array,
  extraSeed?: string,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  worldId = CastToBN(worldId);
  entityId = CastToBN(entityId);
  const worldIdBuffer = Buffer.from(worldId.toArrayLike(Buffer, "be", 8));
  const entityIdBuffer = Buffer.from(entityId.toArrayLike(Buffer, "be", 8));
  const seeds = [Buffer.from("entity"), worldIdBuffer];
  if (extraSeed != null) {
    seeds.push(Buffer.from(new Uint8Array(8)));
    seeds.push(Buffer.from(extraSeed));
  } else {
    seeds.push(entityIdBuffer);
  }
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function FindComponentPda(
  componentProgramId: PublicKey,
  entity: PublicKey,
  componentId: string = ""
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(componentId), entity.toBytes()],
    componentProgramId
  )[0];
}

function CastToBN(id: BN | string | number | Uint8Array) {
  if (!(id instanceof BN)) {
    id = new BN(id);
  }
  return id;
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
