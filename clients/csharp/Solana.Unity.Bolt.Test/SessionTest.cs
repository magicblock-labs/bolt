using GplSession.Program;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Solana.Unity.Bolt.Test;
using Solana.Unity.Programs;
using Solana.Unity.Wallet;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using World.Program;

namespace SessionTest {
    public class Test {
        public static async Task Run(Framework framework) {
            await CreateSession(framework);
            await AddEntity(framework);
            await InitializePositionComponent(framework);
            await ApplyFlySystemOnComponentUsingSessionToken(framework);
        }

        public static async Task CreateSession(Framework framework) {
            framework.SessionToken = WorldProgram.FindSessionTokenPda(framework.SessionSigner.Account.PublicKey, framework.Wallet.Account.PublicKey);
            var createSession = new CreateSessionAccounts() {
                SessionToken = framework.SessionToken,
                SessionSigner = framework.SessionSigner.Account.PublicKey,
                Authority = framework.Wallet.Account.PublicKey,
                TargetProgram = new PublicKey(WorldProgram.ID)
            };
            var instruction = GplSessionProgram.CreateSession(createSession, true, null, 100000000);
            await framework.SendAndConfirmInstruction(instruction, new List<Account> { framework.Wallet.Account, framework.SessionSigner.Account });
        }
        
        public static async Task AddEntity(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.SessionSigner.Account.PublicKey);
            framework.SessionEntityPda = addEntity.Pda;
            await framework.SendAndConfirmInstruction(addEntity.Instruction, new List<Account> { framework.SessionSigner.Account }, framework.SessionSigner.Account.PublicKey);
        }

        public static async Task InitializePositionComponent(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.SessionSigner.Account.PublicKey, framework.SessionEntityPda, framework.ExampleComponentPosition);
            framework.SessionComponentPositionPda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction, new List<Account> { framework.SessionSigner.Account }, framework.SessionSigner.Account.PublicKey);
        }

        public static async Task ApplyFlySystemOnComponentUsingSessionToken(Framework framework) {
            var instruction = Bolt.World.ApplySystem(
                framework.WorldPda,
                framework.SystemSimpleMovement,
                [new Bolt.World.EntityType(framework.SessionEntityPda, [framework.ExampleComponentPosition])],
                new { direction = "Right" },
                framework.SessionSigner.Account.PublicKey,
                framework.SessionToken
            );
            await framework.SendAndConfirmInstruction(instruction, new List<Account> { framework.SessionSigner.Account }, framework.SessionSigner.Account.PublicKey);

            var accountInfo = await framework.GetAccountInfo(framework.SessionComponentPositionPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var position = Position.Accounts.Position.Deserialize(data);
            Assert.AreEqual(1, position.X);
            Assert.AreEqual(0, position.Y);
            Assert.AreEqual(0, position.Z);
        }
   }
}