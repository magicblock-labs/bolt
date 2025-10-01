#pragma warning disable CS8600
#pragma warning disable CS8604
#pragma warning disable CS8618
#pragma warning disable CS8603
#pragma warning disable CS8625

using Solana.Unity.Wallet;
using Solana.Unity.Bolt;
using Solana.Unity.Rpc;
using Solana.Unity.Rpc.Models;
using System;
using System.Threading.Tasks;
using Solana.Unity.Wallet.Bip39;
using World.Program;
using Solana.Unity.Programs;
using Solana.Unity.Rpc.Builders;
using System.Threading.Tasks.Dataflow;
using System.Collections.Generic;
using System.Diagnostics;
using Solana.Unity.Rpc.Types;

namespace Solana.Unity.Bolt.Test
{
    public enum Direction
    {
        Left,
        Right,
        Up,
        Down
    }

    public class Framework
    {
        public Wallet.Wallet Wallet { get; set; }
        public IRpcClient Client { get; set; }
        public IRpcClient AcceleratorClient { get; set; }
        public PublicKey WorldPda { get; set; }
        public ulong WorldId { get; set; }
        public PublicKey RegistryPda { get; set; }
        public Wallet.Wallet SecondAuthority { get; set; }
        public Wallet.Wallet SessionSigner { get; set; }
        public PublicKey SessionEntityPda { get; set; }
        public PublicKey SessionComponentPositionPda { get; set; }
        public PublicKey Entity1Pda { get; set; }
        public PublicKey Entity2Pda { get; set; }
        public PublicKey Entity4Pda { get; set; }
        public PublicKey AccelerationEntityPda { get; set; }
        public PublicKey ExampleComponentPosition { get; set; }
        public PublicKey ExampleComponentVelocity { get; set; }
        public PublicKey ComponentPositionEntity1Pda { get; set; }
        public PublicKey ComponentVelocityEntity1Pda { get; set; }
        public PublicKey ComponentPositionEntity2Pda { get; set; }
        public PublicKey ComponentPositionEntity4Pda { get; set; }
        public PublicKey SystemSimpleMovement { get; set; }
        public PublicKey AccelerationComponentPositionPda { get; set; }

        public PublicKey SessionToken { get; set; }

        // Example bundle
        public PublicKey ExampleBundleProgramId { get; set; }
        public PublicKey BundlePositionEntity1Pda { get; set; }
        public PublicKey BundleVelocityEntity1Pda { get; set; }

        public Framework()
        {
            SecondAuthority = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            
            Wallet = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            SessionSigner = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            Client = ClientFactory.GetClient("http://localhost:8899");
            AcceleratorClient = ClientFactory.GetClient("http://localhost:7799");
            ExampleComponentPosition = new PublicKey(Position.Program.PositionProgram.ID);
            ExampleComponentVelocity = new PublicKey(Velocity.Program.VelocityProgram.ID);
            SystemSimpleMovement = new PublicKey("FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA");
            ExampleBundleProgramId = new PublicKey("CgfPBUeDUL3GT6b5AUDFE56KKgU4ycWA9ERjEWsfMZCj");
        }

        public async Task Initialize()
        {
            await Profiler.Run("RequestAirdrop", async () => {
                var result = await Client.RequestAirdropAsync(Wallet.Account.PublicKey, 2000000000);
                if (!result.WasSuccessful)
                {
                    throw new Exception(result.Reason);
                }
                await Client.ConfirmTransaction(result.Result, Commitment.Processed);
            });
        }

        public async Task<string> SendAndConfirmInstruction(IRpcClient client, TransactionInstruction instruction, List<Account>? signers = null, PublicKey? payer = null, bool mayFail = false)
        {
            if (signers == null) {
                signers = new List<Account> { Wallet.Account };
            }
            var blockHashResponse = await client.GetLatestBlockHashAsync(Commitment.Processed);
            if (!blockHashResponse.WasSuccessful || blockHashResponse.Result?.Value?.Blockhash == null)
                throw new Exception("Failed to get latest blockhash");
            var blockhash = blockHashResponse.Result.Value.Blockhash;
            var transaction = new TransactionBuilder()
                .SetFeePayer(payer ?? Wallet.Account.PublicKey)
                .SetRecentBlockHash(blockhash)
                .AddInstruction(instruction)
                .Build(signers);

            var signature = await client.SendTransactionAsync(transaction, false, Commitment.Processed);
            var confirmed = await client.ConfirmTransaction(signature.Result, Commitment.Processed);
            if (signature.WasSuccessful && confirmed)
            {
                return signature.Result;
            }

            if (mayFail) {
                return null;
            } else {
                string errorMessage = signature.Reason.ToString();
                errorMessage += "\n" + signature.RawRpcResponse;
                if (signature.ErrorData != null) {
                    errorMessage += "\n" + string.Join("\n", signature.ErrorData.Logs);
                }

                Console.WriteLine(errorMessage);
                Environment.Exit(1);
                return null;
            }
        }

        public async Task<string> SendAndConfirmInstruction(TransactionInstruction instruction, List<Account>? signers = null, PublicKey? payer = null, bool mayFail = false)
        {
            return await SendAndConfirmInstruction(Client, instruction, signers, payer, mayFail);
        }

        public async Task<AccountInfo> GetAccountInfo(IRpcClient client, PublicKey publicKey)
        {
            var accountInfo = await client.GetAccountInfoAsync(publicKey, Commitment.Processed);
            if (accountInfo.WasSuccessful)
            {
                return accountInfo.Result.Value;
            }
            throw new Exception(string.Join("\n", accountInfo.ErrorData.Logs));
        }

        public async Task<AccountInfo> GetAccountInfo(PublicKey publicKey)
        {
            return await GetAccountInfo(Client, publicKey);
        }
    }
}
