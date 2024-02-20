/// <reference types="node" />
import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import * as beetSolana from "@metaplex-foundation/beet-solana";
export interface EntityArgs {
  id: beet.bignum;
}
export declare const entityDiscriminator: number[];
export declare class Entity implements EntityArgs {
  readonly id: beet.bignum;
  private constructor();
  static fromArgs(args: EntityArgs): Entity;
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset?: number
  ): [Entity, number];
  static fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Entity>;
  static gpaBuilder(programId?: web3.PublicKey): beetSolana.GpaBuilder<{
    id: any;
    accountDiscriminator: any;
  }>;
  static deserialize(buf: Buffer, offset?: number): [Entity, number];
  serialize(): [Buffer, number];
  static get byteSize(): number;
  static getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number>;
  static hasCorrectByteSize(buf: Buffer, offset?: number): boolean;
  pretty(): {
    id:
      | number
      | {
          toNumber: () => number;
        };
  };
}
export declare const entityBeet: beet.BeetStruct<
  Entity,
  EntityArgs & {
    accountDiscriminator: number[];
  }
>;
//# sourceMappingURL=Entity.d.ts.map
