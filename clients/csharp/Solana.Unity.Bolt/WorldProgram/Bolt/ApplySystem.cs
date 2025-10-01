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
        /// Apply a bundled system and/or bundled components by name, mirroring TS client behavior.
        /// - If systemId is a bundled System (program + name), we use "global:bolt_execute_{name}" discriminator.
        /// - For each component, if provided as bundled Component (program + name), we:
        ///   * use the component name as the PDA seed and
        ///   * build the component-specific update discriminator (name + _update or _update_with_session).
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
            var discriminators = new global::System.Collections.Generic.List<byte[]>();

            foreach (var entry in entities)
            {
                if (entry == null) continue;
                var (entity, components, seeds) = entry.Value;
                for (int i = 0; i < components.Length; i++)
                {
                    var comp = components[i];
                    var seed = comp.Name; // bundled component uses name as seed
                    var pda = WorldProgram.FindComponentPda(comp.Program, entity, seed);
                    remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(comp.Program, false));
                    remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.Writable(pda, false));

                    var discrName = "global:" + (comp.Name != null ? comp.Name + "_" : "") + (sessionToken != null ? "update_with_session" : "update");
                    discriminators.Add(GetDiscriminator(discrName));
                }
            }

            // Optional delimiter and extra accounts
            if ((extraAccounts != null && extraAccounts.Length > 0) || remainingAccounts.Count > 0)
            {
                remainingAccounts.Add(Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(new PublicKey(WorldProgram.ID), false));
                if (extraAccounts != null)
                    remainingAccounts.AddRange(extraAccounts);
            }

            var systemDiscriminator = GetDiscriminator("global:" + (systemId.Name != null ? $"bolt_execute_{systemId.Name}" : "bolt_execute"));

            Solana.Unity.Rpc.Models.TransactionInstruction instruction;
            if (sessionToken != null)
            {
                var apply = new ApplyWithSessionAccounts()
                {
                    BoltSystem = systemId.Program,
                    Authority = authority,
                    CpiAuth = WorldProgram.CpiAuthAddress,
                    World = world,
                    SessionToken = sessionToken,
                };
                instruction = WorldProgram.ApplyWithSession(apply, systemDiscriminator, discriminators.ToArray(), SerializeArgs(args), programId);
            }
            else
            {
                var apply = new ApplyAccounts()
                {
                    BoltSystem = systemId.Program,
                    Authority = authority,
                    CpiAuth = WorldProgram.CpiAuthAddress,
                    World = world,
                };
                instruction = WorldProgram.Apply(apply, systemDiscriminator, discriminators.ToArray(), SerializeArgs(args), programId);
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