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
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            var componentBuffer = WorldProgram.FindBufferPda(componentPda);

            var componentDelegationRecord = WorldProgram.FindDelegationProgramPda("delegation", componentPda);
            var componentDelegationMetadata = WorldProgram.FindDelegationProgramPda("delegation-metadata", componentPda);

            var worldProgram = new PublicKey(WorldProgram.ID);
            var bufferDelegationRecord = WorldProgram.FindDelegationProgramPda("delegation", componentBuffer);
            var bufferDelegationMetadata = WorldProgram.FindDelegationProgramPda("delegation-metadata", componentBuffer);
            var bufferBuffer = WorldProgram.FindBufferPda(componentBuffer, worldProgram);

            byte[] discriminator = new byte[] { 191, 212, 179, 193, 178, 94, 119, 93 };
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
                ProgramId = new PublicKey(WorldProgram.ID),
                Keys = new List<AccountMeta>() {
                    AccountMeta.Writable(payer, true),
                    AccountMeta.Writable(componentPda, false),
                    AccountMeta.Writable(componentBuffer, false),
                    AccountMeta.ReadOnly(componentId, false),
                    AccountMeta.Writable(WorldProgram.FindBufferPda(componentPda, componentId), false),
                    AccountMeta.Writable(componentDelegationRecord, false),
                    AccountMeta.Writable(componentDelegationMetadata, false),
                    AccountMeta.ReadOnly(WorldProgram.DelegationProgram, false),
                    AccountMeta.ReadOnly(SystemProgram.ProgramIdKey, false),
                    AccountMeta.ReadOnly(entity, false),
                    AccountMeta.ReadOnly(worldProgram, false),
                    AccountMeta.Writable(bufferBuffer, false),
                    AccountMeta.Writable(bufferDelegationRecord, false),
                    AccountMeta.Writable(bufferDelegationMetadata, false),
                },
                Data = data,
            };
            return new DelegateComponentInstruction() {
                Pda = componentPda,
                Instruction = instruction,
            };
        }
    }
}
