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
  const component = Component.from(componentId);
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;
  const discriminator = component.getMethodDiscriminator("destroy");
  const componentProgram = component.program;
  const componentProgramData = FindComponentProgramDataPda({
    programId: componentProgram,
  });
  const componentPda = component.pda(entity, seed);
  const instruction = await program.methods
    .destroyComponentWithDiscriminator(discriminator)
    .accounts({
      authority,
      component: componentPda,
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
  const component = Component.from(componentId);
  const discriminator = component.getMethodDiscriminator("initialize");
  const componentProgram = component.program;
  const componentPda = component.pda(entity, seed);
  const program = new Program(
    worldIdl as Idl,
  ) as unknown as Program<WorldProgram>;

  const instruction = await program.methods
    .initializeComponentWithDiscriminator(discriminator)
    .accounts({
      payer,
      entity,
      data: componentPda,
      componentProgram: componentProgram,
      authority: authority ?? PROGRAM_ID,
    })
    .remainingAccounts(anchorRemainingAccounts ?? [])
    .instruction();

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
  let system = System.from(systemId);
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
  let components: { id: PublicKey; pda: PublicKey }[] = [];
  for (const entity of entities) {
    for (const applyComponent of entity.components) {
      const component = Component.from(applyComponent.componentId);
      const id = component.program;
      const pda = component.pda(entity.entity, applyComponent.seed);
      components.push({
        id,
        pda,
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

  const systemDiscriminator = system.getMethodDiscriminator("bolt_execute");

  if (system.name != null) {
    if (session)
      return program.methods
        .applyWithSessionAndDiscriminator(
          systemDiscriminator,
          SerializeArgs(args),
        )
        .accounts({
          authority: authority ?? PROGRAM_ID,
          boltSystem: system.program,
          sessionToken: session.token,
          world,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
    else
      return program.methods
        .applyWithDiscriminator(systemDiscriminator, SerializeArgs(args))
        .accounts({
          authority: authority ?? PROGRAM_ID,
          boltSystem: system.program,
          world,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
  } else {
    if (session)
      return program.methods
        .applyWithSession(SerializeArgs(args))
        .accounts({
          authority: authority ?? PROGRAM_ID,
          boltSystem: system.program,
          sessionToken: session.token,
          world,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
    else
      return program.methods
        .apply(SerializeArgs(args))
        .accounts({
          authority: authority ?? PROGRAM_ID,
          boltSystem: system.program,
          world,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
  }
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
