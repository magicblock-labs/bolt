using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;

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
