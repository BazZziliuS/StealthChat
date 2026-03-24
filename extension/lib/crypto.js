/**
 * StealthChat — Cryptographic operations.
 * ECDH P-256 key exchange, HKDF-SHA256 key derivation, AES-256-GCM encryption.
 * Uses Web Crypto API exclusively — no third-party crypto libraries.
 */

const SCCrypto = (() => {

  const ECDH_CURVE = 'P-256';
  const AES_KEY_BITS = 256;
  const IV_LENGTH = 12;
  const HKDF_INFO = new TextEncoder().encode('StealthChat-v1');
  const HKDF_SALT = new Uint8Array(32); // Zero salt — acceptable for ECDH-derived input

  /**
   * Generate an ECDH key pair.
   * @returns {Promise<CryptoKeyPair>}
   */
  async function generateKeyPair() {
    return crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      true, // extractable — needed for export/storage
      ['deriveKey', 'deriveBits']
    );
  }

  /**
   * Export a public key to raw bytes (65 bytes for P-256 uncompressed).
   * @param {CryptoKey} publicKey
   * @returns {Promise<Uint8Array>}
   */
  async function exportPublicKeyRaw(publicKey) {
    const raw = await crypto.subtle.exportKey('raw', publicKey);
    return new Uint8Array(raw);
  }

  /**
   * Import a public key from raw bytes.
   * @param {Uint8Array} rawBytes
   * @returns {Promise<CryptoKey>}
   */
  async function importPublicKeyRaw(rawBytes) {
    return crypto.subtle.importKey(
      'raw',
      rawBytes,
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      true,
      []
    );
  }

  /**
   * Export a key pair to JWK format (for storage).
   * @param {CryptoKeyPair} keyPair
   * @returns {Promise<{publicKey: object, privateKey: object}>}
   */
  async function exportKeyPairJWK(keyPair) {
    const [pub, priv] = await Promise.all([
      crypto.subtle.exportKey('jwk', keyPair.publicKey),
      crypto.subtle.exportKey('jwk', keyPair.privateKey)
    ]);
    return { publicKey: pub, privateKey: priv };
  }

  /**
   * Import a key pair from JWK format.
   * @param {{publicKey: object, privateKey: object}} jwkPair
   * @returns {Promise<CryptoKeyPair>}
   */
  async function importKeyPairJWK(jwkPair) {
    const [publicKey, privateKey] = await Promise.all([
      crypto.subtle.importKey('jwk', jwkPair.publicKey,
        { name: 'ECDH', namedCurve: ECDH_CURVE }, true, []),
      crypto.subtle.importKey('jwk', jwkPair.privateKey,
        { name: 'ECDH', namedCurve: ECDH_CURVE }, true, ['deriveKey', 'deriveBits'])
    ]);
    return { publicKey, privateKey };
  }

  /**
   * Derive a shared secret from ECDH, then derive AES-256 key via HKDF.
   * @param {CryptoKey} privateKey - Our private key
   * @param {CryptoKey} peerPublicKey - Peer's public key
   * @returns {Promise<CryptoKey>} AES-GCM key
   */
  async function deriveSharedKey(privateKey, peerPublicKey) {
    // Step 1: ECDH shared secret → raw bits
    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: peerPublicKey },
      privateKey,
      256
    );

    // Step 2: Import shared bits as HKDF key material
    const hkdfKey = await crypto.subtle.importKey(
      'raw', sharedBits, 'HKDF', false, ['deriveKey']
    );

    // Step 3: HKDF → AES-256-GCM key
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: HKDF_INFO },
      hkdfKey,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      true, // extractable for export/storage
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Compute session ID: first 4 bytes of SHA-256(exported AES key).
   * @param {CryptoKey} aesKey
   * @returns {Promise<string>} 8-char hex string
   */
  async function computeSessionId(aesKey) {
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);
    const hash = await crypto.subtle.digest('SHA-256', rawKey);
    const bytes = new Uint8Array(hash).slice(0, 4);
    return SCProtocol.bytesToHex(bytes);
  }

  /**
   * Export AES key to base64 (for storage).
   * @param {CryptoKey} aesKey
   * @returns {Promise<string>}
   */
  async function exportAESKey(aesKey) {
    const raw = await crypto.subtle.exportKey('raw', aesKey);
    return arrayBufferToBase64(raw);
  }

  /**
   * Import AES key from base64.
   * @param {string} base64Key
   * @returns {Promise<CryptoKey>}
   */
  async function importAESKey(base64Key) {
    const raw = base64ToArrayBuffer(base64Key);
    return crypto.subtle.importKey(
      'raw', raw,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt plaintext with AES-256-GCM.
   * @param {string} plaintext - UTF-8 text
   * @param {CryptoKey} aesKey
   * @returns {Promise<{iv: Uint8Array, ciphertext: Uint8Array}>}
   */
  async function encrypt(plaintext, aesKey) {
    const encoded = new TextEncoder().encode(plaintext);

    // Compress with pako if available, otherwise use raw
    let data;
    if (typeof pako !== 'undefined') {
      data = pako.deflate(encoded);
    } else {
      data = encoded;
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      data
    );

    return { iv, ciphertext: new Uint8Array(encrypted) };
  }

  /**
   * Decrypt ciphertext with AES-256-GCM.
   * @param {Uint8Array} ciphertext - Encrypted data with auth tag
   * @param {Uint8Array} iv - 12-byte IV
   * @param {CryptoKey} aesKey
   * @returns {Promise<string>} Decrypted UTF-8 text
   * @throws {Error} If auth tag verification fails
   */
  async function decrypt(ciphertext, iv, aesKey) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    let data = new Uint8Array(decrypted);

    // Decompress with pako if available
    if (typeof pako !== 'undefined') {
      try {
        data = pako.inflate(data);
      } catch (e) {
        // Data might not be compressed (e.g., from a version without pako)
      }
    }

    return new TextDecoder().decode(data);
  }

  /**
   * Full pipeline: plaintext → encrypted packet → encoded sentences.
   * Prepends 2-byte length prefix so decoder can strip padding.
   * @param {string} plaintext
   * @param {CryptoKey} aesKey
   * @param {string} sessionId - 8-char hex
   * @returns {Promise<string>} Encoded sentences
   */
  async function encryptAndEncode(plaintext, aesKey, sessionId) {
    const { iv, ciphertext } = await encrypt(plaintext, aesKey);
    const packet = SCProtocol.buildEncryptedPacket(sessionId, iv, ciphertext);
    // Prepend 2-byte big-endian length so we can strip encoder padding on decode
    const withLength = new Uint8Array(2 + packet.length);
    withLength[0] = (packet.length >> 8) & 0xFF;
    withLength[1] = packet.length & 0xFF;
    withLength.set(packet, 2);
    return SCEncoder.encode(withLength);
  }

  /**
   * Full pipeline: encoded sentences → decrypt → plaintext.
   * @param {string} encodedText
   * @param {CryptoKey} aesKey
   * @returns {Promise<string>} Decrypted plaintext
   */
  async function decodeAndDecrypt(encodedText, aesKey) {
    const allBytes = SCEncoder.decode(encodedText);
    if (!allBytes || allBytes.length < 2) throw new Error('Failed to decode sentences');

    // Read 2-byte length prefix and extract exact packet bytes
    const packetLength = (allBytes[0] << 8) | allBytes[1];
    const packetBytes = allBytes.slice(2, 2 + packetLength);

    const packet = SCProtocol.parsePacket(packetBytes);
    if (!packet || packet.type !== SCProtocol.MessageType.ENCRYPTED_TEXT) {
      throw new Error('Invalid packet');
    }

    return decrypt(packet.ciphertext, packet.iv, aesKey);
  }

  /**
   * Encode a key exchange message as sentences.
   * @param {Uint8Array} publicKeyRaw
   * @param {boolean} isResponse
   * @returns {string}
   */
  function encodeKeyExchange(publicKeyRaw, isResponse) {
    const packet = SCProtocol.buildKeyExchangePacket(publicKeyRaw, isResponse);
    const withLength = new Uint8Array(2 + packet.length);
    withLength[0] = (packet.length >> 8) & 0xFF;
    withLength[1] = packet.length & 0xFF;
    withLength.set(packet, 2);
    return SCEncoder.encode(withLength);
  }

  /**
   * Decode sentences to get the raw packet (stripping length prefix and padding).
   * @param {string} encodedText
   * @returns {Uint8Array|null}
   */
  function decodePacket(encodedText) {
    const allBytes = SCEncoder.decode(encodedText);
    if (!allBytes || allBytes.length < 2) return null;
    const packetLength = (allBytes[0] << 8) | allBytes[1];
    return allBytes.slice(2, 2 + packetLength);
  }

  // --- Base64 helpers ---

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return {
    generateKeyPair,
    exportPublicKeyRaw,
    importPublicKeyRaw,
    exportKeyPairJWK,
    importKeyPairJWK,
    deriveSharedKey,
    computeSessionId,
    exportAESKey,
    importAESKey,
    encrypt,
    decrypt,
    encryptAndEncode,
    decodeAndDecrypt,
    encodeKeyExchange,
    decodePacket
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCCrypto;
}
