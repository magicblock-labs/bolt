#pragma warning disable CS1591
#pragma warning disable CS1998

using Solana.Unity.Programs;
using Solana.Unity.Rpc;
using Solana.Unity.Rpc.Models;
using Solana.Unity.Rpc.Types;
using Solana.Unity.Wallet;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using World.Program;

namespace Bolt {
    public partial class World {
        public class DelegateComponentInstruction {
            public PublicKey Pda { get; set; }
            public TransactionInstruction Instruction { get; set; }
        }

        public static async Task<DelegateComponentInstruction> DelegateComponent(PublicKey payer, PublicKey entity, PublicKey componentId, string seed = "") {
            var account = WorldProgram.FindComponentPda(componentId, entity, seed);
            var bufferPda = WorldProgram.FindBufferPda(account, componentId);
            var delegationRecord = WorldProgram.FindDelegationProgramPda("delegation", account);
            var delegationMetadata = WorldProgram.FindDelegationProgramPda("delegation-metadata", account);

            byte[] discriminator = new byte[] { 90, 147, 75, 178, 85, 88, 4, 137 };
            uint commitFrequencyMs = 0;
            byte[] commitFrequencyBytes = BitConverter.GetBytes(commitFrequencyMs);
            if (!BitConverter.IsLittleEndian) Array.Reverse(commitFrequencyBytes);
            var validator = new byte[1];
            validator[0] = 0;

            var data = new byte[discriminator.Length + commitFrequencyBytes.Length + validator.Length];
            Array.Copy(discriminator, data, discriminator.Length);
            Array.Copy(commitFrequencyBytes, 0, data, discriminator.Length, commitFrequencyBytes.Length);
            Array.Copy(validator, 0, data, discriminator.Length + commitFrequencyBytes.Length, validator.Length);

            TransactionInstruction instruction = new TransactionInstruction() {
                ProgramId = componentId,
                Keys = new List<AccountMeta>() {
                    AccountMeta.ReadOnly(payer, true),
                    AccountMeta.ReadOnly(entity, false),
                    AccountMeta.Writable(account, false),
                    AccountMeta.ReadOnly(componentId, false),
                    AccountMeta.Writable(bufferPda, false),
                    AccountMeta.Writable(delegationRecord, false),
                    AccountMeta.Writable(delegationMetadata, false),
                    AccountMeta.ReadOnly(WorldProgram.DelegationProgram, false),
                    AccountMeta.ReadOnly(SystemProgram.ProgramIdKey, false),
                },
                Data = data,
            };
            return new DelegateComponentInstruction() {
                Pda = WorldProgram.FindDelegationProgramPda(seed, entity),
                Instruction = instruction,
            };
        }
    }
}
