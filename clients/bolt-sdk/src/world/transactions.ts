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
  SYSVAR_INSTRUCTIONS_PUBKEY,
  World,
} from "../index";
import BN from "bn.js";
import type web3 from "@solana/web3.js";
import { type Connection, type PublicKey, Transaction } from "@solana/web3.js";
import { PROGRAM_ID } from "generated";

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

  const createEntityIx = createAddEntityInstruction(
    {
      world,
      payer,
      entity: entityPda,
    },
    { extraSeed: null }
  );
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
    authority: authority ?? PROGRAM_ID,
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    anchorRemainingAccounts,
  });

  return {
    transaction: new Transaction().add(initComponentIx),
    componentPda,
  };
}

interface ApplySystemInstruction {
  authority: PublicKey;
  system: PublicKey;
  entities: ApplySystemEntity[];
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}
function getApplyInstructionFunctionName(componentsCount: number) {
  if (componentsCount === 1) return "createApplyInstruction";
  return `createApply${componentsCount}Instruction`;
}

function getBoltComponentName(index: number, componentsCount: number) {
  if (componentsCount === 1) return "boltComponent";
  return `boltComponent${index + 1}`;
}
function getBoltComponentProgramName(index: number, componentsCount: number) {
  if (componentsCount === 1) return "componentProgram";
  return `componentProgram${index + 1}`;
}
function createApplySystemInstruction({
  authority,
  system,
  entities,
  extraAccounts,
  args,
}: ApplySystemInstruction): web3.TransactionInstruction {
  let componentCount = 0;
  for (const entityIndex in entities) {
    const entity = entities[entityIndex];
    componentCount += entity.components.length;
  }
  if (componentCount <= 0) {
    throw new Error("No components provided");
  }
  if (componentCount > MAX_COMPONENTS) {
    throw new Error(
      `Not implemented for component counts outside 1-${MAX_COMPONENTS}`
    );
  }

  const instructionArgs = {
    authority,
    boltSystem: system,
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    anchorRemainingAccounts: extraAccounts,
  };

  for (const entityIndex in entities) {
    const entity = entities[entityIndex];
    for (const componentIndex in entity.components) {
      const component = entity.components[componentIndex];
      const componentPda = FindComponentPda(
        component.id,
        entity.entity,
        component.seed ?? ""
      );
      instructionArgs[
        getBoltComponentProgramName(componentCount, componentCount)
      ] = component.id;
      instructionArgs[getBoltComponentName(componentCount, componentCount)] =
        componentPda;
      componentCount++;
    }
  }

  const instructionFunctions = {
    createApplyInstruction,
    createApply2Instruction,
    createApply3Instruction,
    createApply4Instruction,
    createApply5Instruction,
  };
  const functionName = getApplyInstructionFunctionName(componentCount);
  return instructionFunctions[functionName](instructionArgs, {
    args: SerializeArgs(args),
  });
}

interface ApplySystemEntity {
  entity: PublicKey;
  components: ApplySystemComponent[];
}
interface ApplySystemComponent {
  id: PublicKey;
  seed?: string;
}

/**
 * Apply a system to a set of components
 * @param authority
 * @param system
 * @param entities
 * @param extraAccounts
 * @param args
 * @constructor
 */
export async function ApplySystem({
  authority,
  system,
  entities,
  extraAccounts,
  args = {},
}: {
  authority: PublicKey;
  system: PublicKey;
  entities: ApplySystemEntity[];
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}): Promise<{ transaction: Transaction }> {
  const applySystemIx = createApplySystemInstruction({
    authority,
    system,
    entities,
    extraAccounts,
    args,
  });
  return {
    transaction: new Transaction().add(applySystemIx),
  };
}
