import {
  createAddEntityInstruction,
  createApply2Instruction,
  createApply3Instruction,
  createApply4Instruction,
  createApply5Instruction,
  createApplyInstruction,
  createInitializeComponentInstruction,
  createInitializeNewWorldInstruction,
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindWorldRegistryPda,
  Registry,
  SerializeArgs,
  World,
} from "../index";
import BN from "bn.js";
import type web3 from "@solana/web3.js";
import { type Connection, type PublicKey, Transaction } from "@solana/web3.js";

const MAX_COMPONENTS = 5;

/**
 * Create the transaction to Initialize a new world
 * @param payer
 * @param connection
 * @constructor
 */
export async function InitializeNewWorld({
  payer,
  connection,
}: {
  payer: PublicKey;
  connection: Connection;
}): Promise<{ transaction: Transaction; worldPda: PublicKey; worldId: BN }> {
  const registryPda = FindWorldRegistryPda();
  const registry = await Registry.fromAccountAddress(connection, registryPda);
  const worldId = new BN(registry.worlds);
  const worldPda = FindWorldPda(new BN(worldId));
  const initializeWorldIx = createInitializeNewWorldInstruction({
    world: worldPda,
    registry: registryPda,
    payer,
  });
  return {
    transaction: new Transaction().add(initializeWorldIx),
    worldPda,
    worldId,
  };
}

/**
 * Create the transaction to Add a new entity
 * @param payer
 * @param worldPda
 * @param connection
 * @constructor
 */
export async function AddEntity({
  payer,
  world,
  connection,
}: {
  payer: PublicKey;
  world: PublicKey;
  connection: Connection;
}): Promise<{ transaction: Transaction; entityPda: PublicKey; entityId: BN }> {
  const worldInstance = await World.fromAccountAddress(connection, world);
  const entityId = new BN(worldInstance.entities);
  const entityPda = FindEntityPda(new BN(worldInstance.id), entityId);

  const createEntityIx = createAddEntityInstruction({
    world,
    payer,
    entity: entityPda,
  });
  return {
    transaction: new Transaction().add(createEntityIx),
    entityPda,
    entityId,
  };
}

/**
 * Create the transaction to Initialize a new component
 * @param payer
 * @param entityPda
 * @param componentId
 * @param seeds
 * @param authority
 * @param anchorRemainingAccounts
 * @constructor
 */
export async function InitializeComponent({
  payer,
  entity,
  componentId,
  seed = "",
  authority,
  anchorRemainingAccounts,
}: {
  payer: PublicKey;
  entity: PublicKey;
  componentId: PublicKey;
  seed?: string;
  authority?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}): Promise<{ transaction: Transaction; componentPda: PublicKey }> {
  const componentPda = FindComponentPda(componentId, entity, seed);
  const initComponentIx = createInitializeComponentInstruction({
    payer,
    entity,
    data: componentPda,
    componentProgram: componentId,
    authority,
    anchorRemainingAccounts,
  });

  return {
    transaction: new Transaction().add(initComponentIx),
    componentPda,
  };
}

interface ApplySystemInstruction {
  entity: PublicKey;
  components: PublicKey[];
  system: PublicKey;
  authority: PublicKey;
  seeds?: string[];
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}

export function createApplySystemInstruction({
  entity,
  components,
  system,
  seeds,
  authority,
  extraAccounts,
  args,
}: ApplySystemInstruction): web3.TransactionInstruction {
  const instructionFunctions = {
    createApplyInstruction,
    createApply2Instruction,
    createApply3Instruction,
    createApply4Instruction,
    createApply5Instruction,
  };
  if (components.length === 0) throw new Error("No components provided");
  if (seeds == null) seeds = new Array(components.length).fill("");
  if (seeds.length !== components.length)
    throw new Error("Seed length does not match components length");
  const componentPdas: PublicKey[] = [];

  for (let i = 0; i < components.length; i++) {
    const componentPda = FindComponentPda(components[i], entity, seeds[i]);
    componentPdas.push(componentPda);
  }
  if (components.length < 1 || components.length > MAX_COMPONENTS) {
    throw new Error(
      `Not implemented for component counts outside 1-${MAX_COMPONENTS}`
    );
  }

  const instructionArgs = {
    authority,
    boltSystem: system,
    anchorRemainingAccounts: extraAccounts,
  };

  components.forEach((component, index) => {
    instructionArgs[getBoltComponentProgramName(index, components.length)] =
      component;
    instructionArgs[getBoltComponentName(index, components.length)] =
      componentPdas[index];
  });

  const functionName = getApplyInstructionFunctionName(components.length);
  return instructionFunctions[functionName](instructionArgs, {
    args: SerializeArgs(args),
  });
}

/**
 * Apply a system to an entity and its components
 * @param authority
 * @param system
 * @param entity
 * @param components
 * @param args
 * @param extraAccounts
 * @param seeds
 * @constructor
 */
export async function ApplySystem({
  authority,
  system,
  entity,
  components,
  args = {},
  extraAccounts,
  seeds,
}: {
  authority: PublicKey;
  system: PublicKey;
  entity: PublicKey;
  components: PublicKey[];
  args?: object;
  extraAccounts?: web3.AccountMeta[];
  seeds?: string[];
}): Promise<{ transaction: Transaction }> {
  const applySystemIx = createApplySystemInstruction({
    entity,
    components,
    system,
    authority,
    seeds,
    extraAccounts,
    args,
  });
  return {
    transaction: new Transaction().add(applySystemIx),
  };
}

function getApplyInstructionFunctionName(componentsLength: number) {
  if (componentsLength === 1) return "createApplyInstruction";
  return `createApply${componentsLength}Instruction`;
}

function getBoltComponentName(index: number, componentsLength: number) {
  if (componentsLength === 1) return "boltComponent";
  return `boltComponent${index + 1}`;
}

function getBoltComponentProgramName(index: number, componentsLength: number) {
  if (componentsLength === 1) return "componentProgram";
  return `componentProgram${index + 1}`;
}
