#pragma warning disable CS1591

using Solana.Unity.Rpc;
using Solana.Unity.Wallet;
using System;
using System.Threading.Tasks;
using WorldNamespace = World;

namespace Bolt {
    public partial class World {
        public static async Task<WorldNamespace.Accounts.World> GetWorld(IRpcClient client, PublicKey world) {
            var Response = await client.GetAccountInfoAsync(world.ToString());
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
            return System.Text.Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(args));
        }

    }
}
