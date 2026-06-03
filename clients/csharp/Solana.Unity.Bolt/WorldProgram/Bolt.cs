#pragma warning disable CS1591

using Solana.Unity.Rpc;
using Solana.Unity.Rpc.Types;
using Solana.Unity.Wallet;
using System;
using System.Text;
using System.Threading.Tasks;
using WorldNamespace = World;
using System.Security.Cryptography;

namespace Bolt {
    public partial class World {
        public static async Task<WorldNamespace.Accounts.World> GetWorld(IRpcClient client, PublicKey world, Commitment commitment = Commitment.Finalized) {
            var Response = await client.GetAccountInfoAsync(world.ToString(), commitment);
            if (!Response.WasSuccessful)
            {
                throw new Exception(string.Join("\n", Response.ErrorData.Logs));
            }
            var accountInfo = Response.Result.Value;
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            return WorldNamespace.Accounts.World.Deserialize(data);
        }

        public static byte[] SerializeArgs(object args)
        {
            return Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(args));
        }

        public static byte[] GetDiscriminator(string name) {
            // Anchor uses the first 8 bytes of the SHA256 hash of the instruction name.
            // See: https://github.com/coral-xyz/anchor/blob/master/lang/syn/src/codegen/accounts/discriminator.rs
            var nameBytes = Encoding.UTF8.GetBytes(name);
            using (var sha256 = SHA256.Create()) {
                var hash = sha256.ComputeHash(nameBytes);
                var discriminator = new byte[8];
                Array.Copy(hash, discriminator, 8);
                return discriminator;
            }
        }
    }
}
