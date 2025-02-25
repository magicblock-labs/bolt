#pragma warning disable CS1591

using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using System.Threading.Tasks;
using World.Program;

namespace Bolt {
    public partial class World {
        public class InitializeComponentInstruction {
            public PublicKey Pda { get; set; }
            public TransactionInstruction Instruction { get; set; }
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, byte[] seed, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, string seed, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, PublicKey componentPda, PublicKey authority = null) {
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = payer,
                Entity = entity,
                Data = componentPda,
                ComponentProgram = componentId,
                Authority = authority ?? new PublicKey(WorldProgram.ID)
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            return new InitializeComponentInstruction() {
                Pda = componentPda,
                Instruction = instruction
            };
        }
    }
}