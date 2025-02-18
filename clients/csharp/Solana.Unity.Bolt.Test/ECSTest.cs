
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
            var accountInfo = await framework.GetAccountInfo(framework.WorldPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var world = World.Accounts.World.Deserialize(data);
            framework.Entity1Pda = WorldProgram.FindEntityPda(world.Id, world.Entities);
            var addEntity = new AddEntityAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity1Pda,
                World = framework.WorldPda,
                SystemProgram = SystemProgram.ProgramIdKey,
            };
            var instruction = WorldProgram.AddEntity(addEntity);
            await framework.SendAndConfirmInstruction(instruction);
        }
        
        public static async Task AddEntity2(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.WorldPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var world = World.Accounts.World.Deserialize(data);
            framework.Entity2Pda = WorldProgram.FindEntityPda(world.Id, world.Entities);
            var addEntity = new AddEntityAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity2Pda,
                World = framework.WorldPda,
                SystemProgram = SystemProgram.ProgramIdKey,
            };
            var instruction = WorldProgram.AddEntity(addEntity);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task AddEntity3(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.WorldPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var world = World.Accounts.World.Deserialize(data);
            var Entity3Pda = WorldProgram.FindEntityPda(world.Id, world.Entities);
            var addEntity = new AddEntityAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = Entity3Pda,
                World = framework.WorldPda,
                SystemProgram = SystemProgram.ProgramIdKey,
            };
            var instruction = WorldProgram.AddEntity(addEntity);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task AddEntity4WithSeed(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.WorldPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var world = World.Accounts.World.Deserialize(data);
            framework.Entity4Pda = WorldProgram.FindEntityPda(world.Id, "custom-seed");
            var addEntity = new AddEntityAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity4Pda,
                World = framework.WorldPda,
                SystemProgram = SystemProgram.ProgramIdKey,
            };
            var instruction = WorldProgram.AddEntity(addEntity, "custom-seed");
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task InitializeComponentVelocityOnEntity1WithSeed(Framework framework) {
            framework.ComponentVelocityEntity1Pda = WorldProgram.FindComponentPda(framework.ExampleComponentVelocity, framework.Entity1Pda, "component-velocity");
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity1Pda,
                Data = framework.ComponentVelocityEntity1Pda,
                ComponentProgram = framework.ExampleComponentVelocity,
                Authority = new PublicKey(WorldProgram.ID),
                SystemProgram = SystemProgram.ProgramIdKey,
                InstructionSysvarAccount = SysVars.InstructionAccount,
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task InitializePositionComponentOnEntity1(Framework framework) {
            framework.ComponentPositionEntity1Pda = WorldProgram.FindComponentPda(framework.ExampleComponentPosition, framework.Entity1Pda);
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity1Pda,
                Data = framework.ComponentPositionEntity1Pda,
                ComponentProgram = framework.ExampleComponentPosition,
                Authority = new PublicKey(WorldProgram.ID),
                SystemProgram = SystemProgram.ProgramIdKey,
                InstructionSysvarAccount = SysVars.InstructionAccount,
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task InitializePositionComponentOnEntity2(Framework framework) {
            framework.ComponentPositionEntity2Pda = WorldProgram.FindComponentPda(framework.ExampleComponentPosition, framework.Entity2Pda);
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity2Pda,
                Data = framework.ComponentPositionEntity2Pda,
                ComponentProgram = framework.ExampleComponentPosition,
                Authority = new PublicKey(WorldProgram.ID),
                SystemProgram = SystemProgram.ProgramIdKey,
                InstructionSysvarAccount = SysVars.InstructionAccount,
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task InitializePositionComponentOnEntity4(Framework framework) {
            framework.ComponentPositionEntity4Pda = WorldProgram.FindComponentPda(framework.ExampleComponentPosition, framework.Entity4Pda);
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = framework.Wallet.Account.PublicKey,
                Entity = framework.Entity4Pda,
                Data = framework.ComponentPositionEntity4Pda,
                ComponentProgram = framework.ExampleComponentPosition,
                Authority = new PublicKey(WorldProgram.ID),
                SystemProgram = SystemProgram.ProgramIdKey,
                InstructionSysvarAccount = SysVars.InstructionAccount,
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            await framework.SendAndConfirmInstruction(instruction);
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
            var instruction = WorldProgram.Apply(apply, WorldProgram.SerializeArgs(new { direction = "Up" }));
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
            var instruction = WorldProgram.ApplySystem(
                framework.WorldPda,
                framework.SystemSimpleMovement,
                new WorldProgram.EntityType[] {
                    new WorldProgram.EntityType(framework.Entity1Pda, new PublicKey[] { framework.ExampleComponentPosition })
                },
                WorldProgram.SerializeArgs(new { direction = "Right" }),
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