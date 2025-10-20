#pragma warning disable CS1591
#pragma warning disable CS1998

using Solana.Unity.Rpc.Models;
using Solana.Unity.Wallet;
using System;
using System.Threading.Tasks;
using World.Program;

namespace Bolt {
    public partial class World {
        public class InitializeComponentInstruction {
            public PublicKey Pda { get; set; }
            public TransactionInstruction Instruction { get; set; }
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, byte[] seed, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, string seed, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity, seed);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, PublicKey authority = null) {
            var componentPda = WorldProgram.FindComponentPda(componentId, entity);
            return await InitializeComponent(payer, entity, componentId, componentPda, authority);
        }

        public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, PublicKey componentId, PublicKey componentPda, PublicKey authority = null) {
            var initializeComponent = new InitializeComponentAccounts() {
                Payer = payer,
                Entity = entity,
                Data = componentPda,
                ComponentProgram = componentId,
                Authority = authority ?? new PublicKey(WorldProgram.ID),
            };
            var instruction = WorldProgram.InitializeComponent(initializeComponent);
            return new InitializeComponentInstruction() {
                Pda = componentPda,
                Instruction = instruction
            };
        }

		/// <summary>
		/// Initialize a bundled component using its program and name, mirroring TS client behavior.
		/// Uses component name as seed and component-specific initialize discriminator.
		/// </summary>
		/// <param name="payer">Payer public key.</param>
		/// <param name="entity">Entity PDA.</param>
		/// <param name="component">Bundled component identifier (program + name).</param>
		/// <param name="seed">Optional additional seed; defaults to empty. Final seed is seed + component name.</param>
		/// <param name="authority">Optional authority, defaults to world program id.</param>
		public static async Task<InitializeComponentInstruction> InitializeComponent(PublicKey payer, PublicKey entity, Component component, string seed = "", PublicKey authority = null) {
            if (component is null) throw new ArgumentNullException(nameof(component));
            var discriminator = component.GetMethodDiscriminator("initialize");
            if (discriminator is null || discriminator.Length != 8) throw new ArgumentException("Invalid discriminator", nameof(component));
            var componentPda = WorldProgram.FindComponentPda(component.Program, entity, component.Seeds(seed));
			var initializeComponent = new InitializeComponentAccounts() {
				Payer = payer,
				Entity = entity,
				Data = componentPda,
				ComponentProgram = component.Program,
				Authority = authority ?? new PublicKey(WorldProgram.ID),
			};
            var instruction = WorldProgram.InitializeComponentWithDiscriminator(initializeComponent, discriminator);
			return new InitializeComponentInstruction() {
				Pda = componentPda,
				Instruction = instruction
			};
		}
    }
}