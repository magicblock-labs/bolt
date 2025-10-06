
using Solana.Unity.Wallet;

namespace Bolt {
    /// <summary>
    /// A class that represents an identifier for an ECS component or system.
    /// </summary>
    public class Identifier {
        /// <summary>
        /// The program that the identifier belongs to.
        /// </summary>
        public PublicKey Program { get; set; }

        /// <summary>
        /// The name of the identifier.
        /// </summary>
        public string Name { get; set; }

        /// <summary>   
        /// Initializes a new instance of the <see cref="Identifier"/> class.
        /// </summary>
        /// <param name="program">The program that the identifier belongs to.</param>
        /// <param name="name">The name of the identifier.</param>
        public Identifier(PublicKey program, string name) {
            this.Program = program;
            this.Name = name;
        }

        /// <summary>
        /// Build the 8-byte Anchor discriminator for a given method, mirroring TS Identifier.getMethodDiscriminator.
        /// Format: "global:" + (name? name + "_" : "") + method
        /// </summary>
        public byte[] GetMethodDiscriminator(string method)
        {
            var prefix = string.IsNullOrEmpty(Name) ? "" : Name + "_";
            return World.GetDiscriminator("global:" + prefix + method);
        }
    }
}