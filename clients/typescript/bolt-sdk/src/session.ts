import { Program, Idl } from "@coral-xyz/anchor";
import { sessionIdl } from "./generated";
import { Keypair, PublicKey } from "@solana/web3.js";
let _actualInstance: Program | null = null;

function getOrCreateInstance(): Program {
  if (!_actualInstance) {
    _actualInstance = new Program(sessionIdl as Idl);
  }
  return _actualInstance;
}

export const SessionProgram = new Proxy<Program>({} as Program, {
  get(_target, property, receiver) {
    // Ensure the real object is instantiated
    const actual = getOrCreateInstance();

    // Forward the property access to the real instance
    return Reflect.get(actual, property, receiver);
  },

  set(_target, property, value, receiver) {
    const actual = getOrCreateInstance();
    return Reflect.set(actual, property, value, receiver);
  },

  // If you need to handle method calls specifically (Function type check),
  // or other traps (has, apply, etc.), you can add them here as well.
});

export class Session {
  public readonly signer: Keypair;
  public readonly token: PublicKey;

  constructor(
    public readonly sessionSigner: Keypair,
    public readonly sessionToken: PublicKey,
  ) {
    this.signer = sessionSigner;
    this.token = sessionToken;
  }
}
