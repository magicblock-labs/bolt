/// <reference types="node" />
import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";
import * as beetSolana from "@metaplex-foundation/beet-solana";
export interface RegistryArgs {
  worlds: beet.bignum;
}
export declare const registryDiscriminator: number[];
export declare class Registry implements RegistryArgs {
  readonly worlds: beet.bignum;
  private constructor();
  static fromArgs(args: RegistryArgs): Registry;
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset?: number
  ): [Registry, number];
  static fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Registry>;
  static gpaBuilder(programId?: web3.PublicKey): beetSolana.GpaBuilder<{
    worlds: any;
    accountDiscriminator: any;
  }>;
  static deserialize(buf: Buffer, offset?: number): [Registry, number];
  serialize(): [Buffer, number];
  static get byteSize(): number;
  static getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number>;
  static hasCorrectByteSize(buf: Buffer, offset?: number): boolean;
  pretty(): {
    worlds:
      | number
      | {
          toNumber: () => number;
        };
  };
}
export declare const registryBeet: beet.BeetStruct<
  Registry,
  RegistryArgs & {
    accountDiscriminator: number[];
  }
>;
//# sourceMappingURL=Registry.d.ts.map
