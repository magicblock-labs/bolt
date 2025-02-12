
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
        }

        public static async Task CreateSession(Framework framework) {
            framework.SessionToken = WorldProgram.FindSessionTokenPda(framework.SessionSigner.Account.PublicKey, framework.Wallet.Account.PublicKey);
            var createSession = new CreateSessionAccounts() {
                SessionToken = framework.SessionToken,
                SessionSigner = framework.SessionSigner.Account.PublicKey,
                Authority = framework.Wallet.Account.PublicKey,
                TargetProgram = new PublicKey(WorldProgram.ID)
            };
            var instruction = GplSessionProgram.CreateSession(createSession, true, 1000, 100000000);
            await framework.SendAndConfirmInstruction(instruction, new List<Account> { framework.Wallet.Account, framework.SessionSigner.Account });
        }
        
        public static async Task AddEntity(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.WorldPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var world = World.Accounts.World.Deserialize(data);
            framework.SessionEntityPda = WorldProgram.FindEntityPda(world.Id, world.Entities);
            var addEntity = new AddEntityAccounts() {
                Payer = framework.SessionSigner.Account.PublicKey,
                Entity = framework.SessionEntityPda,
                World = framework.WorldPda
            };
            var instruction = WorldProgram.AddEntity(addEntity);
            await framework.SendAndConfirmInstruction(instruction, new List<Account> { framework.SessionSigner.Account }, framework.SessionSigner.Account.PublicKey);
        }

        public static async Task InitializePositionComponent(Framework framework) {
            var componentId = framework.ExampleComponentPosition;
            framework.SessionComponentPositionPda = WorldProgram.FindComponentPda(
                componentProgramId: componentId,
                entity: framework.SessionEntityPda
            );
            var instruction = WorldProgram.InitializeComponent(new InitializeComponentAccounts() {
                Payer = framework.SessionSigner.Account.PublicKey,
                Entity = framework.SessionEntityPda,
                Data = framework.SessionComponentPositionPda,
                ComponentProgram = componentId,
                Authority = new PublicKey(WorldProgram.ID),
            });
            await framework.SendAndConfirmInstruction(instruction, new List<Account> { framework.SessionSigner.Account }, framework.SessionSigner.Account.PublicKey);
        }

        public static async Task ApplyFlySystemOnComponentUsingSessionToken(Framework framework) {
            var instruction = WorldProgram.ApplySystem(
                framework.WorldPda,
                framework.SystemSimpleMovement,
                new WorldProgram.EntityType[] {
                    new WorldProgram.EntityType(framework.SessionEntityPda, new PublicKey[] { framework.ExampleComponentPosition })
                },
                WorldProgram.SerializeArgs(new { direction = "Right" }),
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