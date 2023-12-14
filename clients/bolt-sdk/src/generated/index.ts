import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
export * from "./accounts";
export * from "./instructions";

/**
 * Program address
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ADDRESS = "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";

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
    [Buffer.from("world"), id.toBuffer("le", 8)],
    programId
  )[0];
}

export function FindEntityPda(
  worldId: BN,
  entityId: BN,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("entity"),
      worldId.toBuffer("be", 8),
      entityId.toBuffer("be", 8),
    ],
    programId
  )[0];
}

export function FindComponentPda(
  componentProgramId: PublicKey,
  entity: PublicKey,
  componentId: string
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(componentId), entity.toBytes()],
    componentProgramId
  )[0];
}
