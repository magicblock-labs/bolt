import { PublicKey } from "@solana/web3.js";
import { Identifier } from "./identifier";

export class System extends Identifier {
  constructor(program: PublicKey, name: string) {
    super(program, name);
  }
}
