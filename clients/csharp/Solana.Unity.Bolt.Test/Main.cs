using Microsoft.VisualStudio.TestTools.UnitTesting;
using Solana.Unity.Rpc.Models;
using System;
using System.Threading.Tasks;
using World.Program;
using Solana.Unity.Programs;

namespace Solana.Unity.Bolt.Test
{
    

    [TestClass]
    [DoNotParallelize]
    public class WorldClientTests
    {

        [TestMethod]
        public async Task Main()
        {
            var framework = new Framework();
            await framework.Initialize();
            await WorldTest.Test.Run(framework);
            await ECSTest.Test.Run(framework);
            await SessionTest.Test.Run(framework);
        }
    }
}
