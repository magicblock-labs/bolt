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
import { PROGRAM_ID } from "../generated";

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
}): Promise<{ transaction: Transaction; worldPda: PublicKey }> {
  const registryPda = FindWorldRegistryPda();
  const registry = await Registry.fromAccountAddress(connection, registryPda);
  const worldPda = FindWorldPda(new BN(registry.worlds));
  const initializeWorldIx = createInitializeNewWorldInstruction({
    world: worldPda,
    registry: registryPda,
    payer,
  });
  return {
    transaction: new Transaction().add(initializeWorldIx),
    worldPda,
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
  seed,
  connection,
}: {
  payer: PublicKey;
  world: PublicKey;
  seed?: string;
  connection: Connection;
}): Promise<{ transaction: Transaction; entityPda: PublicKey }> {
  const worldInstance = await World.fromAccountAddress(connection, world);
  const entityPda = FindEntityPda(
    new BN(worldInstance.id),
    new BN(worldInstance.entities),
    seed
  );
  const createEntityIx = createAddEntityInstruction(
    {
      world,
      payer,
      entity: entityPda,
    },
    { extraSeed: seed ?? null }
  );
  return {
    transaction: new Transaction().add(createEntityIx),
    entityPda,
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
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
  });

  return {
    transaction: new Transaction().add(initComponentIx),
    componentPda,
  };
}

interface ApplySystemInstruction {
  authority: PublicKey;
  systemId: PublicKey;
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
  systemId,
  entities,
  extraAccounts,
  args,
}: ApplySystemInstruction): web3.TransactionInstruction {
  let componentCount = 0;
  entities.forEach(function (entity) {
    componentCount += entity.components.length;
  });
  if (componentCount <= 0) {
    throw new Error("No components provided");
  }
  if (componentCount > MAX_COMPONENTS) {
    throw new Error(
      `Not implemented for component counts outside 1-${MAX_COMPONENTS}`
    );
  }

  const instructionArgs = {
    authority: authority ?? PROGRAM_ID,
    boltSystem: systemId,
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    anchorRemainingAccounts: extraAccounts,
  };

  entities.forEach(function (entity) {
    entity.components.forEach(function (component) {
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
    });
  });

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
 * @param systemId
 * @param entities
 * @param extraAccounts
 * @param args
 * @constructor
 */
export async function ApplySystem({
  authority,
  systemId,
  entities,
  extraAccounts,
  args,
}: {
  authority: PublicKey;
  systemId: PublicKey;
  entities: ApplySystemEntity[];
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}): Promise<{ transaction: Transaction }> {
  const applySystemIx = createApplySystemInstruction({
    authority,
    systemId,
    entities,
    extraAccounts,
    args,
  });
  return {
    transaction: new Transaction().add(applySystemIx),
  };
}
