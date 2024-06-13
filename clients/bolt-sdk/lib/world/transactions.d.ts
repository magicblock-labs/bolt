import BN from "bn.js";
import type web3 from "@solana/web3.js";
import { type Connection, type PublicKey, Transaction } from "@solana/web3.js";
export declare function InitializeNewWorld({ payer, connection, }: {
    payer: PublicKey;
    connection: Connection;
}): Promise<{
    transaction: Transaction;
    worldPda: PublicKey;
    worldId: BN;
}>;
export declare function AddEntity({ payer, world, seed, connection, }: {
    payer: PublicKey;
    world: PublicKey;
    seed?: string;
    connection: Connection;
}): Promise<{
    transaction: Transaction;
    entityPda: PublicKey;
    entityId: BN;
}>;
export declare function InitializeComponent({ payer, entity, componentId, seed, authority, anchorRemainingAccounts, }: {
    payer: PublicKey;
    entity: PublicKey;
    componentId: PublicKey;
    seed?: string;
    authority?: web3.PublicKey;
    anchorRemainingAccounts?: web3.AccountMeta[];
}): Promise<{
    transaction: Transaction;
    componentPda: PublicKey;
}>;
interface ApplySystemEntity {
    entity: PublicKey;
    components: ApplySystemComponent[];
}
interface ApplySystemComponent {
    id: PublicKey;
    seed?: string;
}
export declare function ApplySystem({ authority, systemId, entities, extraAccounts, args, }: {
    authority: PublicKey;
    systemId: PublicKey;
    entities: ApplySystemEntity[];
    extraAccounts?: web3.AccountMeta[];
    args?: object;
}): Promise<{
    transaction: Transaction;
}>;
export {};
//# sourceMappingURL=transactions.d.ts.map