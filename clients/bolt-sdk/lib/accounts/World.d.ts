/// <reference types="node" />
import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import * as beetSolana from "@metaplex-foundation/beet-solana";
export interface WorldArgs {
    id: beet.bignum;
    entities: beet.bignum;
}
export declare const worldDiscriminator: number[];
export declare class World implements WorldArgs {
    readonly id: beet.bignum;
    readonly entities: beet.bignum;
    private constructor();
    static fromArgs(args: WorldArgs): World;
    static fromAccountInfo(accountInfo: web3.AccountInfo<Buffer>, offset?: number): [World, number];
    static fromAccountAddress(connection: web3.Connection, address: web3.PublicKey, commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig): Promise<World>;
    static gpaBuilder(programId?: web3.PublicKey): beetSolana.GpaBuilder<{
        accountDiscriminator: any;
        id: any;
        entities: any;
    }>;
    static deserialize(buf: Buffer, offset?: number): [World, number];
    serialize(): [Buffer, number];
    static get byteSize(): number;
    static getMinimumBalanceForRentExemption(connection: web3.Connection, commitment?: web3.Commitment): Promise<number>;
    static hasCorrectByteSize(buf: Buffer, offset?: number): boolean;
    pretty(): {
        id: number | {
            toNumber: () => number;
        };
        entities: number | {
            toNumber: () => number;
        };
    };
}
export declare const worldBeet: beet.BeetStruct<World, WorldArgs & {
    accountDiscriminator: number[];
}>;
//# sourceMappingURL=World.d.ts.map