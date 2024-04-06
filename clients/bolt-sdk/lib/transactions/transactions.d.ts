import BN from "bn.js";
import type web3 from "@solana/web3.js";
import { type Connection, type PublicKey, Transaction } from "@solana/web3.js";
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
interface ApplySystemInstruction {
  entity: PublicKey;
  components: PublicKey[];
  system: PublicKey;
  authority: PublicKey;
  seeds?: string[];
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}
export declare function createApplySystemInstruction({
  entity,
  components,
  system,
  seeds,
  authority,
  extraAccounts,
  args,
}: ApplySystemInstruction): web3.TransactionInstruction;
export declare function ApplySystem({
  authority,
  system,
  entity,
  components,
  args,
  extraAccounts,
  seeds,
}: {
  authority: PublicKey;
  system: PublicKey;
  entity: PublicKey;
  components: PublicKey[];
  args?: object;
  extraAccounts?: web3.AccountMeta[];
  seeds?: string[];
}): Promise<{
  transaction: Transaction;
}>;
export {};
//# sourceMappingURL=transactions.d.ts.map
