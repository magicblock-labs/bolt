using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Solana.Unity.Programs;
using Solana.Unity.Wallet;
using Solana.Unity.Rpc.Models;
using GplSession.Program;

namespace World
{
    namespace Program
    {
        public partial class WorldProgram
        {
            public static Solana.Unity.Rpc.Models.TransactionInstruction AddEntity(AddEntityAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                return AddEntity(accounts, (byte[]) null, programId);
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction AddEntity(AddEntityAccounts accounts, string extraSeed, PublicKey programId = null)
            {
                programId ??= new(ID);
                return AddEntity(accounts, System.Text.Encoding.UTF8.GetBytes(extraSeed), programId);
            }

            public static PublicKey FindSessionTokenPda(PublicKey sessionSigner, PublicKey authority)
            {
                PublicKey.TryFindProgramAddress(new[]
                {
                    Encoding.UTF8.GetBytes("session_token"),
                    new PublicKey(WorldProgram.ID).KeyBytes,
                    sessionSigner.KeyBytes,
                    authority.KeyBytes
                }, new PublicKey(GplSessionProgram.ID), out var pda, out _);
                return pda;
            }

            public static PublicKey FindRegistryPda()
            {
                PublicKey.TryFindProgramAddress(new[]
                {
                    Encoding.UTF8.GetBytes("registry"),
                }, new PublicKey(ID), out var pda, out _);
                return pda;
            }

            public static PublicKey FindWorldPda(UInt64 worldId)
            {
                PublicKey.TryFindProgramAddress(new[]
                {
                    Encoding.UTF8.GetBytes("world"),
                    BitConverter.GetBytes(worldId).Reverse().ToArray()
                }, new PublicKey(ID), out var pda, out _);
                return pda;

            }

            public static PublicKey FindEntityPda(UInt64 worldId, UInt64 entityId)
            {
                PublicKey.TryFindProgramAddress(new[]
                {
                    Encoding.UTF8.GetBytes("entity"),
                    BitConverter.GetBytes(worldId).Reverse().ToArray(),
                    BitConverter.GetBytes(entityId).Reverse().ToArray()
                }, new PublicKey(ID), out var pda, out _);
                return pda;
            }

            public static PublicKey FindEntityPda(UInt64 worldId, byte[] seed)
            {
                var ZeroArray = new byte[8];
                Array.Fill(ZeroArray, (byte) 0);
                PublicKey.TryFindProgramAddress(new[]
                {
                    Encoding.UTF8.GetBytes("entity"),
                    BitConverter.GetBytes(worldId).Reverse().ToArray(),
                    ZeroArray,
                    seed
                }, new PublicKey(ID), out var pda, out _);
                return pda;
            }

            public static PublicKey FindEntityPda(UInt64 worldId, string seed)
            {
                return FindEntityPda(worldId, System.Text.Encoding.UTF8.GetBytes(seed));
            }

            public static PublicKey FindComponentPda(
                PublicKey componentProgramId,
                PublicKey entity
            ) {
                return FindComponentPda(componentProgramId, entity, "");
            }

            public static PublicKey FindComponentPda(
                PublicKey componentProgramId,
                PublicKey entity,
                string seed
            ) {
                return FindComponentPda(componentProgramId, entity, System.Text.Encoding.UTF8.GetBytes(seed));
            }

            public static PublicKey FindComponentPda(
                PublicKey componentProgramId, 
                PublicKey entity, 
                byte[] seed)

            {
                PublicKey.TryFindProgramAddress(new[]
                {
                    seed, entity.KeyBytes
                }, componentProgramId, out var pda, out _);
                return pda;
            }

            /// <summary>
            /// Convenience bundle for defining an entity and the associated components.
            /// </summary>
            [Obsolete("Use Bolt.World.EntityType instead.")]
            public class EntityType{
                public PublicKey[] Components { get; set; }
                public string[] Seeds { get; set; }
                public PublicKey Entity { get; set; }

                public EntityType(PublicKey entity, PublicKey[] componentsIds)
                {
                    Components = componentsIds;
                    Seeds = new string[Components.Length];
                    Entity = entity;
                    Array.Fill(Seeds, "");
                }

                public EntityType(PublicKey entity, PublicKey[] componentsIds, string[] seeds)
                {
                    Components = componentsIds;
                    Seeds = seeds;
                    Entity = entity;
                    if (Seeds.Length != Components.Length)
                    {
                        throw new ArgumentException("Seeds must be the same length as components");
                    }
                }

                public int ComponentsLength()
                {
                    return Components.Length;
                }

                public PublicKey[] GetComponentsIds()
                {
                    return Components;
                }
                public PublicKey[] GetComponentsPdas()
                {
                    PublicKey[] pdas = new PublicKey[Components.Length];
                    for (int i = 0; i < Components.Length; i++)
                    {
                        pdas[i] = FindComponentPda(Components[i], Entity, Seeds[i]);
                    }
                    return pdas;
                }
            }

            [Obsolete("Use Bolt.World.ApplySystem instead.")]
            public static Solana.Unity.Rpc.Models.TransactionInstruction ApplySystem(
                PublicKey world,
                PublicKey system, 
                EntityType[] systemInput, 
                byte[] args, 
                PublicKey authority, 
                PublicKey sessionToken = null,
                PublicKey programId = null)
            {
                programId ??= new(WorldProgram.ID);

                List<PublicKey> componentIds = new List<PublicKey>();
                List<PublicKey> componentPdas = new List<PublicKey>();

                foreach (var entity in systemInput)
                {
                    componentIds.AddRange(entity.GetComponentsIds());
                    componentPdas.AddRange(entity.GetComponentsPdas());
                }

                if (componentIds.Count != componentPdas.Count)
                {
                    throw new ArgumentException("Component IDs and PDAs must be the same length");
                }

                var apply = new ApplyAccounts() {
                    BoltSystem = system,
                    Authority = authority,
                    InstructionSysvarAccount = SysVars.InstructionAccount,
                    World = world,
                    SessionToken = sessionToken,
                };
                var instruction = Apply(apply, args, programId);
                for (int i = 0; i < componentIds.Count; i++) {
                    instruction.Keys.Add(AccountMeta.ReadOnly(componentIds[i], false));
                    instruction.Keys.Add(AccountMeta.Writable(componentPdas[i], false));
                }

                if (componentIds.Count > 0) {
                    // program id delimits the end of the component list
                    instruction.Keys.Add(AccountMeta.ReadOnly(new PublicKey(WorldProgram.ID), false));
                }

                return instruction;
            }
       }
    }
}