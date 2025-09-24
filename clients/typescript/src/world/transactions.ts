import {
  createAddEntityInstruction,
  createInitializeNewWorldInstruction,
  FindComponentPda,
  FindEntityPda,
  FindWorldPda,
  FindRegistryPda,
  Registry,
  SerializeArgs,
  World,
  SessionProgram,
  Session,
  FindSessionTokenPda,
  WORLD_PROGRAM_ID,
  BN,
  FindComponentProgramDataPda,
  GetDiscriminator,
  Component,
} from "../index";
import type web3 from "@solana/web3.js";
import {
  type Connection,
  Keypair,
  type PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import type WorldProgram from "../generated";
import {
  createInitializeComponentInstruction,
  createInitializeRegistryInstruction,
  PROGRAM_ID,
  worldIdl,
} from "../generated";
import { type Idl, Program } from "@coral-xyz/anchor";
import { System } from "../ecs";

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

export async function CreateSession({
  sessionSigner,
  authority,
  topUp,
  validity,
}: {
  sessionSigner?: Keypair;
  authority: PublicKey;
  topUp?: BN;
  validity?: BN;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  session: Session;
}> {
  sessionSigner = sessionSigner ?? Keypair.generate();
  const sessionToken = FindSessionTokenPda({
    sessionSigner: sessionSigner.publicKey,
    authority,
  });
  const lamports = topUp ?? null;
  const shouldTopUp = topUp ? true : false;
  let instruction = await SessionProgram.methods
    .createSession(shouldTopUp, validity ?? null, lamports)
    .accounts({
      sessionSigner: sessionSigner.publicKey,
      authority,
      targetProgram: WORLD_PROGRAM_ID,
      sessionToken,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
    session: new Session(sessionSigner, sessionToken),
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
    .accountsPartial({
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
    .accountsPartial({
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
 * Create the transaction to Destroy a component
 * @param authority
 * @param component
 * @param world
 * @param connection
 * @constructor
 */
export async function DestroyComponent({
  authority,
  entity,
  componentId,
  receiver,
  seed,
}: {
  authority: PublicKey;
  entity: PublicKey;
  componentId: PublicKey | Component;
  receiver: PublicKey;
  seed?: string;
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
}> {
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const componentName =
    componentId instanceof Component
      ? "global:" + componentId.name + "_destroy"
      : "global:destroy";
  componentId =
    componentId instanceof Component ? componentId.program : componentId;
  const componentProgramData = FindComponentProgramDataPda({
    programId: componentId,
  });
  const componentProgram = componentId;
  const component = FindComponentPda({ componentId, entity, seed });
  const instruction = await program.methods
    .destroyComponent(GetDiscriminator(componentName))
    .accounts({
      authority,
      component,
      entity,
      componentProgram,
      componentProgramData,
      receiver,
    })
    .instruction();
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
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
  componentId: PublicKey | Component;
  seed?: string;
  authority?: web3.PublicKey;
  anchorRemainingAccounts?: web3.AccountMeta[];
}): Promise<{
  instruction: TransactionInstruction;
  transaction: Transaction;
  componentPda: PublicKey;
}> {
  const componentName =
    componentId instanceof Component
      ? "global:" + componentId.name + "_initialize"
      : "global:initialize";
  componentId =
    componentId instanceof Component ? componentId.program : componentId;
  const componentPda = FindComponentPda({ componentId, entity, seed });
  const instruction = createInitializeComponentInstruction({
    payer,
    entity,
    data: componentPda,
    componentProgram: componentId,
    authority: authority ?? PROGRAM_ID,
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

interface ApplySystemInstruction {
  authority: PublicKey;
  systemId: PublicKey | System;
  entities: ApplySystemEntity[];
  world: PublicKey;
  session?: Session;
  extraAccounts?: web3.AccountMeta[];
  args?: any;
}
async function createApplySystemInstruction({
  authority,
  systemId,
  entities,
  world,
  session,
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

  let remainingAccounts: web3.AccountMeta[] = [];
  let components: { id: PublicKey; pda: PublicKey; name?: string }[] = [];
  for (const entity of entities) {
    for (const component of entity.components) {
      const componentPda = FindComponentPda({
        componentId: component.componentId,
        entity: entity.entity,
        seed: component.seed,
      });
      components.push({
        id: component.componentId,
        pda: componentPda,
        name: component.name,
      });
    }
  }
  for (const component of components) {
    remainingAccounts.push({
      pubkey: component.id,
      isSigner: false,
      isWritable: false,
    });
    remainingAccounts.push({
      pubkey: component.pda,
      isSigner: false,
      isWritable: true,
    });
  }
  let extraAccountsInput = extraAccounts ?? [];
  if (extraAccountsInput.length > 0) {
    remainingAccounts.push({
      pubkey: program.programId, // program id delimits the end of the component list
      isSigner: false,
      isWritable: false,
    });
    for (const account of extraAccountsInput) {
      remainingAccounts.push(account);
    }
  }

  // Build discriminators per component in order of remaining accounts pairs
  const discriminators: Buffer[] = components.map((component) =>
    Buffer.from(
      GetDiscriminator(
        "global:" +
          (component.name ? component.name + "_" : "") +
          (session ? "update_with_session" : "update"),
      ),
    ),
  );

  const systemDiscriminator = Buffer.from(
    GetDiscriminator(
      "global:" +
        (systemId instanceof System ? systemId.name + "_" : "") +
        "bolt_execute",
    ),
  );

  if (session)
    return program.methods
      .applyWithSession(
        systemDiscriminator,
        discriminators,
        SerializeArgs(args),
      )
      .accounts({
        authority: authority ?? PROGRAM_ID,
        boltSystem: systemId instanceof System ? systemId.program : systemId,
        sessionToken: session.token,
        world,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
  else
    return program.methods
      .apply(systemDiscriminator, discriminators, SerializeArgs(args))
      .accounts({
        authority: authority ?? PROGRAM_ID,
        boltSystem: systemId instanceof System ? systemId.program : systemId,
        world,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
}

interface ApplySystemEntity {
  entity: PublicKey;
  components: ApplySystemComponent[];
}
interface ApplySystemComponent {
  componentId: PublicKey;
  name?: string;
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
  session,
}: {
  authority: PublicKey;
  systemId: PublicKey | System;
  entities: ApplySystemEntity[];
  world: PublicKey;
  extraAccounts?: web3.AccountMeta[];
  args?: any;
  session?: Session;
}): Promise<{ instruction: TransactionInstruction; transaction: Transaction }> {
  const instruction = await createApplySystemInstruction({
    authority,
    systemId,
    entities,
    world,
    extraAccounts,
    args,
    session,
  });
  const transaction = new Transaction().add(instruction);
  return {
    instruction,
    transaction,
  };
}
