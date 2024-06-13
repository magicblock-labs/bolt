/// <reference types="node" />
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
export * from "./generated/accounts";
export * from "./generated/instructions";
export * from "./world/transactions";
export * from "./delegation/accounts";
export * from "./delegation/delegate";
export declare const SYSVAR_INSTRUCTIONS_PUBKEY: PublicKey;
export declare function FindWorldRegistryPda(programId?: PublicKey): PublicKey;
export declare function FindWorldPda(id: BN | string | number | Uint8Array, programId?: PublicKey): PublicKey;
export declare function FindEntityPda(worldId: BN | string | number | Uint8Array, entityId: BN | string | number | Uint8Array, extraSeed?: string, programId?: PublicKey): PublicKey;
export declare function FindComponentPda(componentProgramId: PublicKey, entity: PublicKey, componentId?: string): PublicKey;
export declare function SerializeArgs(args?: any): Buffer;
//# sourceMappingURL=index.d.ts.map