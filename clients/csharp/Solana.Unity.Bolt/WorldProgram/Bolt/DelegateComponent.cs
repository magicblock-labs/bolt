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
			// Compute the delegated account PDA and related PDAs
			var account = WorldProgram.FindComponentPda(componentId, entity, seed);
			var bufferPda = WorldProgram.FindBufferPda(account, componentId);
			var delegationRecord = WorldProgram.FindDelegationProgramPda("delegation", account);
			var delegationMetadata = WorldProgram.FindDelegationProgramPda("delegation-metadata", account);

			// Build instruction data per TS beet struct:
			// discriminator[8] + commitFrequencyMs[u32 le] + validator[COption<Pubkey>] + pdaSeeds[Vec<Bytes>]
			byte[] discriminator = new byte[] { 90, 147, 75, 178, 85, 88, 4, 137 };
			uint commitFrequencyMs = 0;
			byte[] commitFrequencyBytes = BitConverter.GetBytes(commitFrequencyMs); // little-endian on most platforms
			byte[] validatorNoneTag = new byte[] { 0 }; // COption None

			var data = Concat(discriminator, commitFrequencyBytes, validatorNoneTag);

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
				Pda = account,
				Instruction = instruction,
			};
		}

		/// <summary>
		/// Overload for bundled components: seed is augmented with component name.
		/// Mirrors TS behavior using component.seeds(seed) for PDA seeds.
		/// </summary>
		public static async Task<DelegateComponentInstruction> DelegateComponent(PublicKey payer, PublicKey entity, Component component, string seed = "") {
			var account = WorldProgram.FindComponentPda(component.Program, entity, component.Seeds(seed));
			var bufferPda = WorldProgram.FindBufferPda(account, component.Program);
			var delegationRecord = WorldProgram.FindDelegationProgramPda("delegation", account);
			var delegationMetadata = WorldProgram.FindDelegationProgramPda("delegation-metadata", account);

			byte[] discriminator = new byte[] { 90, 147, 75, 178, 85, 88, 4, 137 };
			uint commitFrequencyMs = 0;
			byte[] commitFrequencyBytes = BitConverter.GetBytes(commitFrequencyMs);
			byte[] validatorNoneTag = new byte[] { 0 };

			var data = Concat(discriminator, commitFrequencyBytes, validatorNoneTag);

			TransactionInstruction instruction = new TransactionInstruction() {
				ProgramId = component.Program,
				Keys = new List<AccountMeta>() {
					AccountMeta.ReadOnly(payer, true),
					AccountMeta.ReadOnly(entity, false),
					AccountMeta.Writable(account, false),
					AccountMeta.ReadOnly(component.Program, false),
					AccountMeta.Writable(bufferPda, false),
					AccountMeta.Writable(delegationRecord, false),
					AccountMeta.Writable(delegationMetadata, false),
					AccountMeta.ReadOnly(WorldProgram.DelegationProgram, false),
					AccountMeta.ReadOnly(SystemProgram.ProgramIdKey, false),
				},
				Data = data,
			};
			return new DelegateComponentInstruction() {
				Pda = account,
				Instruction = instruction,
			};
		}

		private static byte[] BuildVecOfBytes(byte[][] items)
		{
			// beet array encoding: u32 count, then each element as beet.bytes => u32 length + bytes
			var countLe = BitConverter.GetBytes((uint)items.Length);
			if (!BitConverter.IsLittleEndian) Array.Reverse(countLe);
			List<byte> result = new List<byte>(4);
			result.AddRange(countLe);
			foreach (var item in items)
			{
				var lenLe = BitConverter.GetBytes((uint)(item?.Length ?? 0));
				if (!BitConverter.IsLittleEndian) Array.Reverse(lenLe);
				result.AddRange(lenLe);
				if (item != null && item.Length > 0)
					result.AddRange(item);
			}
			return result.ToArray();
		}

		private static byte[] Concat(params byte[][] arrays)
		{
			int total = 0;
			foreach (var a in arrays) total += a.Length;
			var buf = new byte[total];
			int offset = 0;
			foreach (var a in arrays)
			{
				Buffer.BlockCopy(a, 0, buf, offset, a.Length);
				offset += a.Length;
			}
			return buf;
		}
    }
}
