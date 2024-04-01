import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
export * from "./accounts";
export * from "./instructions";
export * from "./transactions/transactions";

/**
 * Program address
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ADDRESS = "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";

export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);

/**
 * Program public key
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ID = new PublicKey(PROGRAM_ADDRESS);

export function FindWorldRegistryPda(
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId
  )[0];
}

export function FindWorldPda(
  id: BN,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("world"), id.toBuffer("be", 8)],
    programId
  )[0];
}

export function FindEntityPda(
  worldId: BN,
  entityId: BN,
  extraSeed?: string,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  const seeds = [Buffer.from("entity"), worldId.toBuffer("be", 8)];
  if (extraSeed != null) {
    seeds.push(Buffer.from(new Uint8Array(8)));
    seeds.push(Buffer.from(extraSeed));
  } else {
    seeds.push(entityId.toBuffer("be", 8));
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
