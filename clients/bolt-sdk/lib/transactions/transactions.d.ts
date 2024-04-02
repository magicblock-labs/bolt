import BN from "bn.js";
import { type PublicKey, Transaction, type Connection } from "@solana/web3.js";
import type web3 from "@solana/web3.js";
export declare function InitializeNewWorld({
  payer,
  connection,
}: {
  payer: PublicKey;
  connection: Connection;
}): Promise<{
  transaction: Transaction;
  worldPda: PublicKey;
  worldId: BN;
}>;
export declare function AddEntity({
  payer,
  worldPda,
  connection,
}: {
  payer: PublicKey;
  worldPda: PublicKey;
  connection: Connection;
}): Promise<{
  transaction: Transaction;
  entityPda: PublicKey;
  entityId: BN;
}>;
export declare function InitializeComponent({
  payer,
  entityPda,
  componentId,
  seed,
  authority,
  anchorRemainingAccounts,
}: {
  payer: PublicKey;
  entityPda: PublicKey;
  componentId: PublicKey;
  seed?: string;
  authority?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}): Promise<{
  transaction: Transaction;
  componentPda: PublicKey;
}>;
export declare function ApplySystem({
  authority,
  boltSystem,
  entityPda,
  components,
  args,
  extraAccounts,
  seed,
}: {
  authority: PublicKey;
  boltSystem: PublicKey;
  entityPda: PublicKey;
  components: PublicKey[];
  args?: object;
  extraAccounts?: web3.AccountMeta[];
  seed?: string[];
}): Promise<{
  transaction: Transaction;
}>;
//# sourceMappingURL=transactions.d.ts.map
