import { PublicKey } from "@solana/web3.js";
import { Identifier } from "./identifier";

export class System extends Identifier {
  constructor(program: PublicKey, name?: string) {
    super(program, name);
  }

  static from(systemId: PublicKey | System): System {
    return systemId instanceof System ? systemId : new System(systemId);
  }
}
