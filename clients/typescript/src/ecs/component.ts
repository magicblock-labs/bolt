import { PublicKey } from "@solana/web3.js";
import { Identifier } from "./identifier";
import { FindComponentPda } from "../index";

export class Component extends Identifier {
  constructor(program: PublicKey, name?: string) {
    super(program, name);
  }

  static from(componentId: PublicKey | Component): Component {
    return componentId instanceof Component
      ? componentId
      : new Component(componentId);
  }

  pda(entity: PublicKey, seed?: string): PublicKey {
    return FindComponentPda({
      componentId: this.program,
      entity,
      seed: this.seeds(seed),
    });
  }

  seeds(seed?: string): string {
    return (this.name ?? "") + (seed ?? "");
  }
}
