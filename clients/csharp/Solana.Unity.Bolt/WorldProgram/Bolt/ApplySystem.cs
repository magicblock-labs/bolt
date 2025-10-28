#pragma warning disable CS1591
#pragma warning disable CS0618

using Solana.Unity.Wallet;
using System;
using System.Linq;
using World.Program;

namespace Bolt {
    public partial class World {
        /// <summary>
        /// Apply a system providing raw public keys (existing overloads)
        /// </summary>
        public static Solana.Unity.Rpc.Models.TransactionInstruction ApplySystem(
            PublicKey world,
            PublicKey system, 
            EntityType[] systemInput, 
            byte[] args, 
            PublicKey authority, 
            PublicKey sessionToken = null,
            PublicKey programId = null)
        {
            var entityTypes = systemInput.Select(e => new WorldProgram.EntityType(e.Entity, e.Components, e.Seeds)).ToArray();
            return WorldProgram.ApplySystem(world, system, entityTypes, args, authority, sessionToken, programId);
        }

        public static Solana.Unity.Rpc.Models.TransactionInstruction ApplySystem(
            PublicKey world,
            PublicKey system, 
            EntityType[] systemInput,
            object args, 
            PublicKey authority, 
            PublicKey sessionToken = null,
            PublicKey programId = null)
        {
            var entityTypes = systemInput.Select(e => new WorldProgram.EntityType(e.Entity, e.Components, e.Seeds)).ToArray();
            return WorldProgram.ApplySystem(world, system, entityTypes, SerializeArgs(args), authority, sessionToken, programId);
        }

        public static Solana.Unity.Rpc.Models.TransactionInstruction ApplySystem(
            PublicKey world,
            PublicKey system, 
            EntityType[] systemInput, 
            PublicKey authority, 
            PublicKey sessionToken = null,
            PublicKey programId = null)
        {
            var entityTypes = systemInput.Select(e => new WorldProgram.EntityType(e.Entity, e.Components, e.Seeds)).ToArray();
            return WorldProgram.ApplySystem(world, system, entityTypes, new byte[] {}, authority, sessionToken, programId);
        }

        /// <summary>
        /// Apply a bundled system and components, mirroring TS client behavior.
        /// Chooses among apply/applyWithSession/applyWithDiscriminator/applyWithSessionAndDiscriminator
        /// based on whether the System has a name (discriminator) and whether a session token is provided.
        /// Component discriminators are no longer sent; only component id + PDA pairs are included.
        /// </summary>
        public static Solana.Unity.Rpc.Models.TransactionInstruction ApplySystem(
            PublicKey world,
            System systemId,
            (PublicKey entity, Component[] components, string[] seeds)?[] entities,
            object args,
            PublicKey authority,
            PublicKey sessionToken = null,
            PublicKey programId = null,
            Solana.Unity.Rpc.Models.AccountMeta[] extraAccounts = null)
        {
            programId ??= new(WorldProgram.ID);

            var remainingAccounts = new global::System.Collections.Generic.List<Solana.Unity.Rpc.Models.AccountMeta>();

            foreach (var entry in entities)
            {
                if (entry == null) continue;
                var (entity, components, seeds) = entry.Value;
                for (int i = 0; i < components.Length; i++)
                {
                    var comp = components[i];
                    var providedSeed = (seeds != null && i < seeds.Length) ? seeds[i] : "";
                    var pda = WorldProgram.FindComponentPda(comp.Program, entity, comp.Seeds(providedSeed));
                    remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(comp.Program, false));
                    remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.Writable(pda, false));
                }
            }

            // Optional delimiter and extra accounts
            if (extraAccounts != null && extraAccounts.Length > 0)
            {
                remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(new PublicKey(WorldProgram.ID), false));
                remainingAccounts.AddRange(extraAccounts);
            }

            bool hasSystemName = !string.IsNullOrEmpty(systemId.Name);
            var serializedArgs = SerializeArgs(args);

            Solana.Unity.Rpc.Models.TransactionInstruction instruction;
            if (sessionToken != null)
            {
                var accounts = new ApplyWithSessionAccounts()
                {
                    BoltSystem = systemId.Program,
                    Authority = authority,
                    World = world,
                    SessionToken = sessionToken,
                };
                if (hasSystemName)
                {
                    var sysDisc = systemId.GetMethodDiscriminator("bolt_execute");
                    instruction = WorldProgram.ApplyWithSessionAndDiscriminator(accounts, sysDisc, serializedArgs, programId);
                }
                else
                {
                    instruction = WorldProgram.ApplyWithSession(accounts, serializedArgs, programId);
                }
            }
            else
            {
                var accounts = new ApplyAccounts()
                {
                    BoltSystem = systemId.Program,
                    Authority = authority,
                    World = world,
                };
                if (hasSystemName)
                {
                    var sysDisc = systemId.GetMethodDiscriminator("bolt_execute");
                    instruction = WorldProgram.ApplyWithDiscriminator(accounts, sysDisc, serializedArgs, programId);
                }
                else
                {
                    instruction = WorldProgram.Apply(accounts, serializedArgs, programId);
                }
            }

            // Append remaining accounts (component id+pda pairs and extras)
            foreach (var meta in remainingAccounts)
                instruction.Keys.Add(meta);

            return instruction;
        }


        public class EntityType {
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
        }
    }
}