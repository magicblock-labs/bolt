pub const fn discriminator_for(name: &str) -> [u8; 8] {
    let mut discriminator = [0u8; 8];

    let hash = const_crypto::sha2::Sha256::new()
        .update(name.as_bytes())
        .finalize();

    let hash_bytes = hash.as_slice();

    let mut i = 0;
    while i < 8 {
        discriminator[i] = hash_bytes[i];
        i += 1;
    }

    discriminator
}