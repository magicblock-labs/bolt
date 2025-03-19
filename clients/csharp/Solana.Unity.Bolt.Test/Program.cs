
using System;
using System.Threading.Tasks;

namespace Solana.Unity.Bolt.Test
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var framework = new Framework();
            await framework.Initialize();
            await WorldTest.Test.Run(framework);
            await ECSTest.Test.Run(framework);
            await SessionTest.Test.Run(framework);
            await AccelerationTest.Test.Run(framework);
        }
    }
}