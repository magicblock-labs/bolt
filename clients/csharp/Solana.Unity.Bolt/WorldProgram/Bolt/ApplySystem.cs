using Solana.Unity.Wallet;
using System;
using System.Linq;
using World.Program;

namespace Bolt {
    public partial class World {
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