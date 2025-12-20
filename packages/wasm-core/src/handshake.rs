use rand::RngCore;
use rand::rngs::OsRng;
use crate::identity::IdentityKey;

/// Generates a random 32-byte challenge (Nonce).
pub fn generate_challenge() -> [u8; 32] {
    let mut nonce = [0u8; 32];
    OsRng.fill_bytes(&mut nonce);
    nonce
}

/// Signs a challenge with the user's identity.
pub fn sign_challenge(identity: &IdentityKey, challenge: &[u8]) -> [u8; 64] {
    identity.sign(challenge)
}

/// Verifies a challenge response.
/// Returns true if the signature is valid for the given challenge and public key.
pub fn verify_challenge_response(
    public_key_bytes: &[u8; 32],
    challenge: &[u8],
    signature_bytes: &[u8; 64]
) -> bool {
    IdentityKey::verify(public_key_bytes, challenge, signature_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_handshake_flow() {
        // Peer A (Verifier) generates a challenge
        let challenge = generate_challenge();

        // Peer B (Prover) has an identity
        let peer_b_identity = IdentityKey::generate();
        let peer_b_pub_key = peer_b_identity.public_key_bytes();

        // Peer B signs the challenge
        let signature = sign_challenge(&peer_b_identity, &challenge);

        // Peer A verifies the signature matches Peer B's public key and the challenge
        let is_valid = verify_challenge_response(&peer_b_pub_key, &challenge, &signature);
        assert!(is_valid, "Handshake verification failed");
    }

    #[test]
    fn test_handshake_tampering() {
        let challenge = generate_challenge();
        let peer_b_identity = IdentityKey::generate();
        let peer_b_pub_key = peer_b_identity.public_key_bytes();

        let signature = sign_challenge(&peer_b_identity, &challenge);

        // Attacker tries to use a different challenge
        let fake_challenge = generate_challenge();
        assert!(!verify_challenge_response(&peer_b_pub_key, &fake_challenge, &signature));

        // Attacker tries to use a different signature
        let mut fake_signature = signature;
        fake_signature[0] = !fake_signature[0]; // Bit flip
        assert!(!verify_challenge_response(&peer_b_pub_key, &challenge, &fake_signature));
    }
}
