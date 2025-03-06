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
        public PublicKey ExampleComponentPosition { get; set; }
        public PublicKey ExampleComponentVelocity { get; set; }
        public PublicKey ComponentPositionEntity1Pda { get; set; }
        public PublicKey ComponentVelocityEntity1Pda { get; set; }
        public PublicKey ComponentPositionEntity2Pda { get; set; }
        public PublicKey ComponentPositionEntity4Pda { get; set; }
        public PublicKey SystemSimpleMovement { get; set; }

        public PublicKey SessionToken { get; set; }

        public Framework()
        {
            SecondAuthority = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            
            Wallet = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            SessionSigner = new Wallet.Wallet(new Mnemonic(WordList.English, WordCount.Twelve));
            Client = ClientFactory.GetClient("http://localhost:8899");

            ExampleComponentPosition = new PublicKey(Position.Program.PositionProgram.ID);
            ExampleComponentVelocity = new PublicKey(Velocity.Program.VelocityProgram.ID);
            SystemSimpleMovement = new PublicKey("FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA");
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

        public async Task<string> SendAndConfirmInstruction(TransactionInstruction instruction, List<Account>? signers = null, PublicKey? payer = null)
        {
            if (signers == null) {
                signers = new List<Account> { Wallet.Account };
            }
            var blockHashResponse = await Client.GetLatestBlockHashAsync(Commitment.Processed);
            if (!blockHashResponse.WasSuccessful || blockHashResponse.Result?.Value?.Blockhash == null)
                throw new Exception("Failed to get latest blockhash");
            var blockhash = blockHashResponse.Result.Value.Blockhash;
            var transaction = new TransactionBuilder()
                .SetFeePayer(payer ?? Wallet.Account.PublicKey)
                .SetRecentBlockHash(blockhash)
                .AddInstruction(instruction)
                .Build(signers);

            var signature = await Client.SendTransactionAsync(transaction, true, Commitment.Processed);
            var confirmed = await Client.ConfirmTransaction(signature.Result, Commitment.Processed);
            if (signature.WasSuccessful && confirmed)
            {
                return signature.Result;
            }
            string errorMessage = signature.Reason.ToString();
            errorMessage += "\n" + signature.RawRpcResponse;
            if (signature.ErrorData != null) {
                errorMessage += "\n" + string.Join("\n", signature.ErrorData.Logs);
            }
            throw new Exception(errorMessage);
        }

        public async Task<AccountInfo> GetAccountInfo(PublicKey publicKey)
        {
            var accountInfo = await Client.GetAccountInfoAsync(publicKey, Commitment.Processed);
            if (accountInfo.WasSuccessful)
            {
                return accountInfo.Result.Value;
            }
            throw new Exception(string.Join("\n", accountInfo.ErrorData.Logs));
        }
    }
}
