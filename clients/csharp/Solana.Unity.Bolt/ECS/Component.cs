

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

        /// <summary>
        /// Static constructor from either a raw program id or an existing Component, like TS Component.from.
        /// </summary>
        public static Component From(object componentId)
        {
            if (componentId is Component c) return c;
            if (componentId is PublicKey pk) return new Component(pk, null);
            throw new global::System.ArgumentException("componentId must be PublicKey or Component");
        }

        /// <summary>
        /// Build seeds: (seed ?? "") + (Name ?? ""), mirroring TS seeds().
        /// </summary>
        public string Seeds(string seed = null)
        {
            return (seed ?? "") + (Name ?? "");
        }
    }
}