#pragma warning disable CS1591
#pragma warning disable CS1998

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
                Authority = new PublicKey(WorldProgram.ID),
                CpiAuth = WorldProgram.CpiAuthAddress
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent, GetDiscriminator("global:initialize"));
            return new InitializeComponentInstruction() {
                Pda = componentPda,
                Instruction = instruction
            };
        }
    }
}