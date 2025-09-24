

using Solana.Unity.Wallet;

namespace Bolt {
    /// <summary>
    /// A class that represents an ECS component.
    /// </summary>
    public class Component : Identifier {
        /// <summary>
        /// Initializes a new instance of the <see cref="Component"/> class.
        /// </summary>
        /// <param name="program">The program that the component belongs to.</param>
        /// <param name="name">The name of the component.</param>
        public Component(PublicKey program, string name) : base(program, name) {}
    }
}