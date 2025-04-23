using Solana.Unity.Bolt.Test;
using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using Solana.Unity.Bolt;
using Solana.Unity.Rpc;
using System;
using System.Threading.Tasks;
using Solana.Unity.Wallet.Bip39;
using World.Program;
using System.Diagnostics;
using Solana.Unity.Rpc.Types;
namespace AccelerationTest {
    public class Test {
        public static async Task Run(Framework framework) {
            await Profiler.Run("AddAccelerationEntity", async () => {
                await AddAccelerationEntity(framework);
            });
            await Profiler.Run("InitializePositionComponentOnAccelerationEntity", async () => {
                await InitializePositionComponentOnAccelerationEntity(framework);
            });
            await Profiler.Run("DelegateComponent", async () => {
                await DelegateComponent(framework);
            });
            await Profiler.Run("ApplySimpleMovementSystemOnAccelerator 10", async () => {
                await ApplySimpleMovementSystemOnAccelerator(framework);
            });
        }

        public static async Task AddAccelerationEntity(Framework framework) {
            var addEntity = await Bolt.World.AddEntity(framework.Client, framework.WorldPda, framework.Wallet.Account.PublicKey, Commitment.Processed);
            framework.AccelerationEntityPda = addEntity.Pda;
            await framework.SendAndConfirmInstruction(addEntity.Instruction);
        }

        public static async Task InitializePositionComponentOnAccelerationEntity(Framework framework) {
            var initializeComponent = await Bolt.World.InitializeComponent(framework.Wallet.Account.PublicKey, framework.AccelerationEntityPda, framework.ExampleComponentPosition);
            framework.AccelerationComponentPositionPda = initializeComponent.Pda;
            await framework.SendAndConfirmInstruction(initializeComponent.Instruction);
        }

        public static async Task DelegateComponent(Framework framework) {
            var delegateComponent = await Bolt.World.DelegateComponent(framework.Wallet.Account.PublicKey, framework.AccelerationEntityPda, framework.ExampleComponentPosition);
            await framework.SendAndConfirmInstruction(delegateComponent.Instruction);
        }

        // TODO: Re-enable this test when ephemeral-validator is properly installed on the CI.
        // public static async Task ApplySimpleMovementSystemOnAccelerator(Framework framework) {
        //     for (int i = 0; i < 10; i++) {
        //         var apply = new ApplyAccounts() {
        //             Authority = framework.Wallet.Account.PublicKey,
        //             BoltSystem = framework.SystemSimpleMovement,
        //             World = framework.WorldPda,
        //         };
        //         var instruction = WorldProgram.Apply(apply, Bolt.World.SerializeArgs(new { direction = "Up" }));
        //         instruction.Keys.Add(AccountMeta.ReadOnly(framework.ExampleComponentPosition, false));
        //         instruction.Keys.Add(AccountMeta.Writable(framework.AccelerationComponentPositionPda, false));
        //         await framework.SendAndConfirmInstruction(framework.AcceleratorClient, instruction);
        //         await Task.Delay(50);
        //     }
        // }
   }
}