import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
export * from "./accounts";
export * from "./instructions";
export declare const PROGRAM_ADDRESS =
  "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";
export declare const PROGRAM_ID: PublicKey;
export declare function FindWorldRegistryPda(programId?: PublicKey): PublicKey;
export declare function FindWorldPda(id: BN, programId?: PublicKey): PublicKey;
export declare function FindEntityPda(
  worldId: BN,
  entityId: BN,
  extraSeed?: string,
  programId?: PublicKey
): PublicKey;
export declare function FindComponentPda(
  componentProgramId: PublicKey,
  entity: PublicKey,
  componentId: string
): PublicKey;
//# sourceMappingURL=index.d.ts.map
