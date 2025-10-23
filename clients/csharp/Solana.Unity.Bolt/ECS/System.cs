

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

        /// <summary>
        /// Static constructor from either a raw program id or an existing System, like TS System.from.
        /// </summary>
        public static System From(object systemId)
        {
            if (systemId is System s) return s;
            if (systemId is PublicKey pk) return new System(pk, null);
            throw new global::System.ArgumentException("systemId must be PublicKey or System");
        }
    }
}