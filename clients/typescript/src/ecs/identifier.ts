import { PublicKey } from "@solana/web3.js";

export class Identifier {
  public program: PublicKey;
  public name?: string;

  constructor(program: PublicKey, name?: string) {
    this.program = program;
    this.name = name;
  }

  getMethodDiscriminator(method: string): string {
    return "global:" + (this.name ? this.name + "_" : "") + method;
  }
}
