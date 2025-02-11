
using Solana.Unity.Bolt.Test;
using Solana.Unity.Programs;
using Solana.Unity.Rpc.Models;
using System;
using System.Threading.Tasks;
using World.Accounts;
using World.Program;

namespace WorldTest {
    public class Test {
        public static async Task Run(Framework framework) {
            await InitializeRegistry(framework);
            await InitializeWorld(framework);
        }

        public static async Task InitializeRegistry(Framework framework) {
            framework.RegistryPda = WorldProgram.FindRegistryPda();

            InitializeRegistryAccounts initializeRegistry = new InitializeRegistryAccounts() {
                Registry = framework.RegistryPda,
                Payer = framework.Wallet.Account.PublicKey,
                SystemProgram = SystemProgram.ProgramIdKey,
            };

            TransactionInstruction instruction = WorldProgram.InitializeRegistry(initializeRegistry);
            try {
                await framework.SendAndConfirmInstruction(instruction);
            } catch (Exception e) {
                // We ignore this error because it happens when the registry already exists
            }

        }

        public static async Task InitializeWorld(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.RegistryPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var registry = Registry.Deserialize(data);

            framework.WorldPda = WorldProgram.FindWorldPda(registry.Worlds);

            var initializeNewWorld = new InitializeNewWorldAccounts() {
                Registry = framework.RegistryPda,
                Payer = framework.Wallet.Account.PublicKey,
                SystemProgram = SystemProgram.ProgramIdKey,
                World = framework.WorldPda,
            };

            TransactionInstruction instruction = WorldProgram.InitializeNewWorld(initializeNewWorld);
            await framework.SendAndConfirmInstruction(instruction);
        }

        public static async Task InitializeSecondWorld(Framework framework) {
            var accountInfo = await framework.GetAccountInfo(framework.RegistryPda);
            var data = Convert.FromBase64String(accountInfo.Data[0]);
            var registry = Registry.Deserialize(data);

            var WorldPda = WorldProgram.FindWorldPda(registry.Worlds);

            var initializeNewWorld = new InitializeNewWorldAccounts() {
                Registry = framework.RegistryPda,
                Payer = framework.Wallet.Account.PublicKey,
                SystemProgram = SystemProgram.ProgramIdKey,
                World = WorldPda,
            };

            TransactionInstruction instruction = WorldProgram.InitializeNewWorld(initializeNewWorld);
            await framework.SendAndConfirmInstruction(instruction);
        }
    }
}