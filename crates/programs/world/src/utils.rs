/// Computes an 8-byte discriminator for the given name.
///
/// The discriminator is derived by taking the first 8 bytes of the SHA-256 hash
/// of the input name. This is used for discriminator-based routing in bundled
/// components and systems.
///
/// # Collision Risk
///
/// Using 8 bytes (64 bits) of a hash introduces a small collision probability.
/// With the birthday paradox, collisions become likely after ~2^32 different names.
/// This is acceptable for component/system name spaces in practice.
///
/// # Examples
///
/// ```
/// let disc = discriminator_for("Position");
/// assert_eq!(disc.len(), 8);
/// ```
pub const fn discriminator_for(name: &str) -> [u8; 8] {
    let mut discriminator = [0u8; 8];

    let hash = const_crypto::sha2::Sha256::new()
        .update(name.as_bytes())
        .finalize();

    let hash_bytes = hash.as_slice();

    // Manual loop required for const fn compatibility
    let mut i = 0;
    while i < 8 {
        discriminator[i] = hash_bytes[i];
        i += 1;
    }

    discriminator
}
