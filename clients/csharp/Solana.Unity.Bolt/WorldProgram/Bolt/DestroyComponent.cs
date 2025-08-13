#pragma warning disable CS1591
#pragma warning disable CS1998

using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using System.Threading.Tasks;
using World.Program;

namespace Bolt {
    public partial class World {
        public class DestroyComponentInstruction {
            public TransactionInstruction Instruction { get; set; }
        }

        public static async Task<DestroyComponentInstruction> DestroyComponent(PublicKey authority, PublicKey receiver, PublicKey entity, PublicKey componentId, byte[] seed) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await DestroyComponent(authority, receiver, entity, componentId, componentPda);
        }

        public static async Task<DestroyComponentInstruction> DestroyComponent(PublicKey authority, PublicKey receiver, PublicKey entity, PublicKey componentId, string seed) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await DestroyComponent(authority, receiver, entity, componentId, componentPda);
        }

        public static async Task<DestroyComponentInstruction> DestroyComponent(PublicKey authority, PublicKey receiver, PublicKey entity, PublicKey componentId) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity);
            return await DestroyComponent(authority, receiver, entity, componentId, componentPda);
        }

        public static async Task<DestroyComponentInstruction> DestroyComponent(PublicKey authority, PublicKey receiver, PublicKey entity, PublicKey componentProgram, PublicKey componentPda) {
            var componentProgramData = WorldProgram.FindComponentProgramDataPda(componentProgram);
            var destroyComponent = new DestroyComponentAccounts() {
                CpiAuth = WorldProgram.CPI_AUTH_ADDRESS,
                Authority = authority,
                Receiver = receiver,
                Entity = entity,
                Component = componentPda,
                ComponentProgram = componentProgram,
                ComponentProgramData = componentProgramData
            };
            var instruction = WorldProgram.DestroyComponent(destroyComponent);
            return new DestroyComponentInstruction() {
                Instruction = instruction
            };
        }
    }
}