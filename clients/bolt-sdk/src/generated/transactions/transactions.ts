import {
  createAddEntityInstruction,
  createInitializeComponentInstruction,
  createInitializeNewWorldInstruction,
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindWorldRegistryPda,
  Registry,
  SerializeArgs,
  World,
  createApplyInstruction,
  createApply2Instruction,
  createApply3Instruction,
  createApply4Instruction,
  createApply5Instruction,
} from "../index";
import BN from "bn.js";
import { type PublicKey, Transaction, type Connection } from "@solana/web3.js";
import type web3 from "@solana/web3.js";

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
  worldPda,
  connection,
}: {
  payer: PublicKey;
  worldPda: PublicKey;
  connection: Connection;
}): Promise<{ transaction: Transaction; entityPda: PublicKey; entityId: BN }> {
  const world = await World.fromAccountAddress(connection, worldPda);
  const entityId = new BN(world.entities);
  const entityPda = FindEntityPda(new BN(world.id), entityId);

  const createEntityIx = createAddEntityInstruction({
    world: worldPda,
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
 * @param seed
 * @param authority
 * @param anchorRemainingAccounts
 * @constructor
 */
export async function InitializeComponent({
  payer,
  entityPda,
  componentId,
  seed = "",
  authority,
  anchorRemainingAccounts,
}: {
  payer: PublicKey;
  entityPda: PublicKey;
  componentId: PublicKey;
  seed?: string;
  authority?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}): Promise<{ transaction: Transaction; componentPda: PublicKey }> {
  const componentPda = FindComponentPda(componentId, entityPda, seed);
  const initComponentIx = createInitializeComponentInstruction({
    payer,
    entity: entityPda,
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

/**
 * Apply a system to an entity and its components
 * @param authority
 * @param boltSystem
 * @param entityPda
 * @param components
 * @param args
 * @param extraAccounts
 * @param seed
 * @constructor
 */
export async function ApplySystem({
  authority,
  boltSystem,
  entityPda,
  components,
  args = {},
  extraAccounts,
  seed,
}: {
  authority: PublicKey;
  boltSystem: PublicKey;
  entityPda: PublicKey;
  components: PublicKey[];
  args?: object;
  extraAccounts?: web3.AccountMeta[];
  seed?: string[];
}): Promise<{ transaction: Transaction }> {
  const instructionFunctions = {
    createApplyInstruction,
    createApply2Instruction,
    createApply3Instruction,
    createApply4Instruction,
    createApply5Instruction,
  };
  if (components.length === 0) throw new Error("No components provided");
  if (seed == null) seed = new Array(components.length).fill("");
  if (seed.length !== components.length)
    throw new Error("Seed length does not match components length");
  const componentPdas: PublicKey[] = [];
  components.forEach((component) => {
    const componentPda = FindComponentPda(component, entityPda, "");
    componentPdas.push(componentPda);
  });

  if (components.length < 1 || components.length > MAX_COMPONENTS) {
    throw new Error(
      `Not implemented for component counts outside 1-${MAX_COMPONENTS}`
    );
  }

  const instructionArgs = {
    authority,
    boltSystem,
    anchorRemainingAccounts: extraAccounts,
  };

  components.forEach((component, index) => {
    instructionArgs[getBoltComponentProgramName(index, components.length)] =
      component;
    instructionArgs[getBoltComponentName(index, components.length)] =
      componentPdas[index];
  });

  const functionName = getApplyInstructionFunctionName(components.length);
  const applySystemIx = instructionFunctions[functionName](instructionArgs, {
    args: SerializeArgs(args),
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
