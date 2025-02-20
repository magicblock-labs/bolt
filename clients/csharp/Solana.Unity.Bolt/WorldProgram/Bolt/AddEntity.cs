
using Solana.Unity.Rpc;
using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using System.Text;
using System.Threading.Tasks;
using World.Program;

namespace Bolt {
    public partial class World {
        public class AddEntityInstruction {
            public PublicKey Pda { get; set; }
            public TransactionInstruction Instruction { get; set; }
        }

        public static async Task<AddEntityInstruction> AddEntity(PublicKey world, PublicKey payer, PublicKey entityPda, string seed) {
            return await AddEntity(world, payer, entityPda, Encoding.UTF8.GetBytes(seed));
        }

        public static async Task<AddEntityInstruction> AddEntity(PublicKey world, PublicKey payer, PublicKey entityPda, byte[] seed = null) {
            var addEntity = new AddEntityAccounts() {
                Payer = payer,
                Entity = entityPda,
                World = world,
            };

            return new AddEntityInstruction() {
                Pda = entityPda,
                Instruction = WorldProgram.AddEntity(addEntity, seed, new PublicKey(WorldProgram.ID)),
            };
        }

        public static async Task<AddEntityInstruction> AddEntity(IRpcClient client, PublicKey world, PublicKey payer, string seed) {
            var worldData = await GetWorld(client, world);
            return await AddEntity(world, payer, seed, worldData.Id);
        }

        public static async Task<AddEntityInstruction> AddEntity(PublicKey world, PublicKey payer, string seed, ulong worldId) {
            return await AddEntity(world, payer, Encoding.UTF8.GetBytes(seed), worldId);
        }

        public static async Task<AddEntityInstruction> AddEntity(PublicKey world, PublicKey payer, byte[] seed, ulong worldId) {
            var entityPda = WorldProgram.FindEntityPda(worldId, seed);
            return await AddEntity(world, payer, entityPda, seed);
        }

        public static async Task<AddEntityInstruction> AddEntity(IRpcClient client, PublicKey world, PublicKey payer) {
            var worldData = await GetWorld(client, world);
            var entityPda = WorldProgram.FindEntityPda(worldData.Id, worldData.Entities);
            return await AddEntity(world, payer, entityPda);
        }
    }
}
