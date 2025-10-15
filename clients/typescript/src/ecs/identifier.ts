import { PublicKey } from "@solana/web3.js";
import { GetDiscriminator } from "../index";

export class Identifier {
  public program: PublicKey;
  public name?: string;

  constructor(program: PublicKey, name?: string) {
    this.program = program;
    this.name = name;
  }

  getMethodDiscriminator(method: string): Buffer {
    return GetDiscriminator(
      "global:" + (this.name ? this.name + "_" : "") + method,
    );
  }
}
