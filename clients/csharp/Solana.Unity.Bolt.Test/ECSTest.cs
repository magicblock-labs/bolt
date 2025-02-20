
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Solana.Unity.Bolt.Test;
using Solana.Unity.Programs;
using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using System;
using System.Threading.Tasks;
using World.Program;

namespace ECSTest {
    public class Test {
        public static async Task Run(Framework framework) {
            await AddEntity1(framework);
            await AddEntity2(framework);
            await AddEntity3(framework);
            await AddEntity4WithSeed(framework);
            await InitializeComponentVelocityOnEntity1WithSeed(framework);
            await InitializePositionComponentOnEntity1(framework);
            await InitializePositionComponentOnEntity2(framework);
            await InitializePositionComponentOnEntity4(framework);
            await CheckPositionOnEntity1IsDefault(framework);
            await ApplySimpleMovementSystemUpOnEntity1(framework);
            await ApplySimpleMovementSystemRightOnEntity1(framework);
        }

        public static async Task AddEntity1(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.Wallet.Account.PublicKey);
            framework.Entity1Pda = addEntity.Pda;
            await framework.SendAndConfirmInstruction(addEntity.Instruction);
        }
        
        public static async Task AddEntity2(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.Wallet.Account.PublicKey);
            framework.Entity2Pda = addEntity.Pda;
            await framework.SendAndConfirmInstruction(addEntity.Instruction);
        }

        public static async Task AddEntity3(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.Wallet.Account.PublicKey);
            await framework.SendAndConfirmInstruction(addEntity.Instruction);
        }

        public static async Task AddEntity4WithSeed(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.Wallet.Account.PublicKey, "custom-seed");
            framework.Entity4Pda = addEntity.Pda;
            await framework.SendAndConfirmInstruction(addEntity.Instruction);
        }

        public static async Task InitializeComponentVelocityOnEntity1WithSeed(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.Wallet.Account.PublicKey, framework.Entity1Pda, framework.ExampleComponentVelocity, "component-velocity");
            framework.ComponentVelocityEntity1Pda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction);
        }

        public static async Task InitializePositionComponentOnEntity1(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.Wallet.Account.PublicKey, framework.Entity1Pda, framework.ExampleComponentPosition);
            framework.ComponentPositionEntity1Pda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction);
        }

        public static async Task InitializePositionComponentOnEntity2(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.Wallet.Account.PublicKey, framework.Entity2Pda, framework.ExampleComponentPosition);
            framework.ComponentPositionEntity2Pda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction);
        }

        public static async Task InitializePositionComponentOnEntity4(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.Wallet.Account.PublicKey, framework.Entity4Pda, framework.ExampleComponentPosition);
            framework.ComponentPositionEntity4Pda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction);
        }

        public static async Task CheckPositionOnEntity1IsDefault(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.ComponentPositionEntity1Pda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var position = Position.Accounts.Position.Deserialize(data);
            Assert.AreEqual(0, position.X);
            Assert.AreEqual(0, position.Y);
            Assert.AreEqual(0, position.Z);
        }

        public static async Task ApplySimpleMovementSystemUpOnEntity1(Framework framework) {
            var apply = new ApplyAccounts() {
                Authority = framework.Wallet.Account.PublicKey,
                BoltSystem = framework.SystemSimpleMovement,
                InstructionSysvarAccount = SysVars.InstructionAccount,
                SessionToken = null,
                World = framework.WorldPda,
            };
            var instruction = WorldProgram.Apply(apply, Bolt.World.SerializeArgs(new { direction = "Up" }));
            instruction.Keys.Add(AccountMeta.ReadOnly(framework.ExampleComponentPosition, false));
            instruction.Keys.Add(AccountMeta.Writable(framework.ComponentPositionEntity1Pda, false));
            await framework.SendAndConfirmInstruction(instruction);

            var accountInfo = await framework.GetAccountInfo(framework.ComponentPositionEntity1Pda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var position = Position.Accounts.Position.Deserialize(data);
            Assert.AreEqual(0, position.X);
            Assert.AreEqual(1, position.Y);
            Assert.AreEqual(0, position.Z);
        }

        public static async Task ApplySimpleMovementSystemRightOnEntity1(Framework framework) {
            var instruction = Bolt.World.ApplySystem(
                framework.WorldPda,
                framework.SystemSimpleMovement,
                new Bolt.World.EntityType[] {
                    new Bolt.World.EntityType(framework.Entity1Pda, new PublicKey[] { framework.ExampleComponentPosition })
                },
                new { direction = "Right" },
                framework.Wallet.Account.PublicKey
            );
            await framework.SendAndConfirmInstruction(instruction);

            var accountInfo = await framework.GetAccountInfo(framework.ComponentPositionEntity1Pda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var position = Position.Accounts.Position.Deserialize(data);
            Assert.AreEqual(1, position.X);
            Assert.AreEqual(1, position.Y);
            Assert.AreEqual(0, position.Z);
        }
   }
}