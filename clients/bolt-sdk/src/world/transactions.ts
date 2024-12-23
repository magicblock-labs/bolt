import {
  createApplyInstruction,
  createAddEntityInstruction,
  createInitializeComponentInstruction,
  createInitializeNewWorldInstruction,
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindRegistryPda,
  Registry,
  SerializeArgs,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  World,
} from "../index";
import BN from "bn.js";
import type web3 from "@solana/web3.js";
import {
  type Connection,
  type PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import type WorldProgram from "../generated";
import {
  createInitializeRegistryInstruction,
  PROGRAM_ID,
  worldIdl,
} from "../generated";
import { type Idl, Program } from "@coral-xyz/anchor";

const MAX_COMPONENTS = 5;

export async function InitializeRegistry({
  payer,
  connection,
}: {
  payer: PublicKey;
  connection: Connection;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const registry = FindRegistryPda({});
  const instruction = createInitializeRegistryInstruction({ registry, payer });
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}

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
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  worldPda: PublicKey;
  worldId: BN;
}> {
  const registryPda = FindRegistryPda({});
  const registry = await Registry.fromAccountAddress(connection, registryPda);
  const worldId = new BN(registry.worlds);
  const worldPda = FindWorldPda({ worldId });
  const instruction = createInitializeNewWorldInstruction({
    world: worldPda,
    registry: registryPda,
    payer,
  });
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
    worldPda,
    worldId,
  };
}

/**
 * Create the transaction to Add a new authority
 * @param authority
 * @param newAuthority
 * @param world
 * @param connection
 * @constructor
 */
export async function AddAuthority({
  authority,
  newAuthority,
  world,
  connection,
}: {
  authority: PublicKey;
  newAuthority: PublicKey;
  world: PublicKey;
  connection: Connection;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const worldInstance = await World.fromAccountAddress(connection, world);
  const worldId = new BN(worldInstance.id);
  const instruction = await program.methods
    .addAuthority(worldId)
    .accounts({
      authority,
      newAuthority,
      world,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}

/**
 * Create the transaction to Remove an authority
 * @param authority
 * @param authorityToDelete
 * @param world
 * @param connection
 * @constructor
 */
export async function RemoveAuthority({
  authority,
  authorityToDelete,
  world,
  connection,
}: {
  authority: PublicKey;
  authorityToDelete: PublicKey;
  world: PublicKey;
  connection: Connection;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const worldInstance = await World.fromAccountAddress(connection, world);
  const worldId = new BN(worldInstance.id);
  const instruction = await program.methods
    .removeAuthority(worldId)
    .accounts({
      authority,
      authorityToDelete,
      world,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}

/**
 * Create the transaction to Approve a system
 * @param authority
 * @param systemToApprove
 * @param world
 * @constructor
 */
export async function ApproveSystem({
  authority,
  systemToApprove,
  world,
}: {
  authority: PublicKey;
  systemToApprove: PublicKey;
  world: PublicKey;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const instruction = await program.methods
    .approveSystem()
    .accounts({
      authority,
      system: systemToApprove,
      world,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}

/**
 * Create the transaction to Remove a system
 * @param authority
 * @param systemToRemove
 * @param world
 * @constructor
 */
export async function RemoveSystem({
  authority,
  systemToRemove,
  world,
}: {
  authority: PublicKey;
  systemToRemove: PublicKey;
  world: PublicKey;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const instruction = await program.methods
    .removeSystem()
    .accounts({
      authority,
      system: systemToRemove,
      world,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
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
  seed?: Uint8Array;
  connection: Connection;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  entityPda: PublicKey;
}> {
  const worldInstance = await World.fromAccountAddress(connection, world);
  const worldId = new BN(worldInstance.id);
  const entityPda =
    seed !== undefined
      ? FindEntityPda({ worldId, seed })
      : FindEntityPda({ worldId, entityId: new BN(worldInstance.entities) });
  const instruction = createAddEntityInstruction(
    {
      world,
      payer,
      entity: entityPda,
    },
    { extraSeed: seed ?? null },
  );
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
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
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  componentPda: PublicKey;
}> {
  const componentPda = FindComponentPda({ componentId, entity, seed });
  const instruction = createInitializeComponentInstruction({
    payer,
    entity,
    data: componentPda,
    componentProgram: componentId,
    authority: authority ?? PROGRAM_ID, // TODO: Should this be handled on the program side?
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    anchorRemainingAccounts,
  });
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
    componentPda,
  };
}

export async function Apply({
  authority,
  boltSystem,
  boltComponent,
  componentProgram,
  anchorRemainingAccounts,
  world,
  args,
}: {
  authority: PublicKey;
  boltSystem: PublicKey;
  boltComponent: PublicKey;
  componentProgram: PublicKey;
  world: PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
  args: Uint8Array | any;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  if (!(args instanceof Uint8Array)) {
    args = SerializeArgs(args);
  }
  const instruction = createApplyInstruction(
    {
      authority,
      boltSystem,
      boltComponent,
      componentProgram,
      instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
      anchorRemainingAccounts,
      world,
    },
    {
      args,
    },
  );
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}

interface ApplySystemInstruction {
  authority: PublicKey;
  systemId: PublicKey;
  entities: ApplySystemEntity[];
  world: PublicKey;
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}
function getApplyInstructionFunctionName(componentsCount: number) {
  return `apply${componentsCount > 1 ? componentsCount : ""}`;
}
function getBoltComponentName(index: number, componentsCount: number) {
  if (componentsCount === 1) return "boltComponent";
  return `boltComponent${index + 1}`;
}
function getBoltComponentProgramName(index: number, componentsCount: number) {
  if (componentsCount === 1) return "componentProgram";
  return `componentProgram${index + 1}`;
}
async function createApplySystemInstruction({
  authority,
  systemId,
  entities,
  world,
  extraAccounts,
  args,
}: ApplySystemInstruction): Promise<web3.TransactionInstruction> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  let componentCount = 0;
  entities.forEach(function (entity) {
    componentCount += entity.components.length;
  });
  if (componentCount <= 0) {
    throw new Error("No components provided");
  }
  if (componentCount > MAX_COMPONENTS) {
    throw new Error(
      `Not implemented for component counts outside 1-${MAX_COMPONENTS}`,
    );
  }

  const applyAccounts = {
    authority: authority ?? PROGRAM_ID,
    boltSystem: systemId,
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    world,
  };

  let componentIndex = 0;
  entities.forEach(function (entity) {
    entity.components.forEach(function (component) {
      const componentPda = FindComponentPda({
        componentId: component.componentId,
        entity: entity.entity,
        seed: component.seed,
      });
      applyAccounts[
        getBoltComponentProgramName(componentIndex, componentCount)
      ] = component.componentId;
      applyAccounts[getBoltComponentName(componentIndex, componentCount)] =
        componentPda;
      componentIndex++;
    });
  });
  return program.methods[getApplyInstructionFunctionName(componentCount)](
    SerializeArgs(args),
  )
    .accounts(applyAccounts)
    .remainingAccounts(extraAccounts ?? [])
    .instruction();
}

interface ApplySystemEntity {
  entity: PublicKey;
  components: ApplySystemComponent[];
}
interface ApplySystemComponent {
  componentId: PublicKey;
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
  world,
  extraAccounts,
  args,
}: {
  authority: PublicKey;
  systemId: PublicKey;
  entities: ApplySystemEntity[];
  world: PublicKey;
  extraAccounts?: web3.AccountMeta[];
  args?: object;
}): Promise<{ instruction: TransactionInstruction; transaction: Transaction }> {
  const instruction = await createApplySystemInstruction({
    authority,
    systemId,
    entities,
    world,
    extraAccounts,
    args,
  });
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}
