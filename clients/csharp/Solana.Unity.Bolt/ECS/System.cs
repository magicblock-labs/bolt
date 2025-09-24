

using Solana.Unity.Wallet;

namespace Bolt {
    /// <summary>
    /// A class that represents an ECS system.
    /// </summary>
    public class System : Identifier {
        /// <summary>
        /// Initializes a new instance of the <see cref="System"/> class.
        /// </summary>
        /// <param name="program">The program that the system belongs to.</param>
        /// <param name="name">The name of the system.</param>
        public System(PublicKey program, string name) : base(program, name) {}
    }
}