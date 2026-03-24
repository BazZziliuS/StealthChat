/**
 * StealthChat — Cryptographic operations.
 * ECDH P-256 key exchange, HKDF-SHA256 key derivation, AES-256-GCM encryption.
 * Uses Web Crypto API exclusively — no third-party crypto libraries.
 */

const SCCrypto = (() => {

  const ECDH_CURVE = 'P-256';
  const AES_KEY_BITS = 256;
  const IV_LENGTH = 12;
  const TAG_LENGTH = 64; // 8 bytes (64 bits) — compact auth tag
  const HKDF_INFO = new TextEncoder().encode('StealthChat-v1');
  const HKDF_SALT = new Uint8Array(32);

  // --- Key management ---

  async function generateKeyPair() {
    return crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  async function exportPublicKeyRaw(publicKey) {
    const raw = await crypto.subtle.exportKey('raw', publicKey);
    return new Uint8Array(raw);
  }

  async function importPublicKeyRaw(rawBytes) {
    return crypto.subtle.importKey(
      'raw', rawBytes,
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      true, []
    );
  }

  async function exportKeyPairJWK(keyPair) {
    const [pub, priv] = await Promise.all([
      crypto.subtle.exportKey('jwk', keyPair.publicKey),
      crypto.subtle.exportKey('jwk', keyPair.privateKey)
    ]);
    return { publicKey: pub, privateKey: priv };
  }

  async function importKeyPairJWK(jwkPair) {
    const [publicKey, privateKey] = await Promise.all([
      crypto.subtle.importKey('jwk', jwkPair.publicKey,
        { name: 'ECDH', namedCurve: ECDH_CURVE }, true, []),
      crypto.subtle.importKey('jwk', jwkPair.privateKey,
        { name: 'ECDH', namedCurve: ECDH_CURVE }, true, ['deriveKey', 'deriveBits'])
    ]);
    return { publicKey, privateKey };
  }

  async function deriveSharedKey(privateKey, peerPublicKey) {
    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: peerPublicKey },
      privateKey, 256
    );
    const hkdfKey = await crypto.subtle.importKey(
      'raw', sharedBits, 'HKDF', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: HKDF_INFO },
      hkdfKey,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async function computeSessionId(aesKey) {
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);
    const hash = await crypto.subtle.digest('SHA-256', rawKey);
    // 2 bytes for v2 protocol (4 hex chars)
    const bytes = new Uint8Array(hash).slice(0, 2);
    return SCProtocol.bytesToHex(bytes);
  }

  async function exportAESKey(aesKey) {
    const raw = await crypto.subtle.exportKey('raw', aesKey);
    return arrayBufferToBase64(raw);
  }

  async function importAESKey(base64Key) {
    const raw = base64ToArrayBuffer(base64Key);
    return crypto.subtle.importKey(
      'raw', raw,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // --- Compression (built-in CompressionStream) ---

  async function compress(data) {
    if (typeof CompressionStream === 'undefined') return null;
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(data);
      writer.close();
      return await streamToBytes(cs.readable);
    } catch {
      return null;
    }
  }

  async function decompress(data) {
    if (typeof DecompressionStream === 'undefined') return null;
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(data);
      writer.close();
      return await streamToBytes(ds.readable);
    } catch {
      return null;
    }
  }

  async function streamToBytes(readable) {
    const reader = readable.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  // --- Encrypt / Decrypt ---

  async function encrypt(plaintext, aesKey) {
    const encoded = new TextEncoder().encode(plaintext);

    // Try compression — use only if it actually shrinks the data
    let data = encoded;
    let compressed = false;
    const deflated = await compress(encoded);
    if (deflated && deflated.length < encoded.length) {
      data = deflated;
      compressed = true;
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
      aesKey,
      data
    );

    return { iv, ciphertext: new Uint8Array(encrypted), compressed };
  }

  async function decrypt(ciphertext, iv, aesKey, isCompressed) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
      aesKey,
      ciphertext
    );

    let data = new Uint8Array(decrypted);

    if (isCompressed) {
      const inflated = await decompress(data);
      if (inflated) data = inflated;
    }

    return new TextDecoder().decode(data);
  }

  // --- Full pipeline ---

  async function encryptAndEncode(plaintext, aesKey, sessionId) {
    const { iv, ciphertext, compressed } = await encrypt(plaintext, aesKey);
    const packet = SCProtocol.buildEncryptedPacket(sessionId, iv, ciphertext, compressed);
    // 1-byte length prefix (max 255 bytes per packet — sufficient for messages)
    const withLength = new Uint8Array(1 + packet.length);
    withLength[0] = packet.length & 0xFF;
    withLength.set(packet, 1);
    return SCEncoder.encode(withLength);
  }

  async function decodeAndDecrypt(encodedText, aesKey) {
    const allBytes = SCEncoder.decode(encodedText);
    if (!allBytes || allBytes.length < 1) throw new Error('Failed to decode sentences');

    // 1-byte length prefix
    const packetLength = allBytes[0];
    const packetBytes = allBytes.slice(1, 1 + packetLength);

    const packet = SCProtocol.parsePacket(packetBytes);
    if (!packet || packet.type !== SCProtocol.MessageType.ENCRYPTED_TEXT) {
      throw new Error('Invalid packet');
    }

    return decrypt(packet.ciphertext, packet.iv, aesKey, packet.compressed);
  }

  function encodeKeyExchange(publicKeyRaw, isResponse) {
    const packet = SCProtocol.buildKeyExchangePacket(publicKeyRaw, isResponse);
    const withLength = new Uint8Array(1 + packet.length);
    withLength[0] = packet.length & 0xFF;
    withLength.set(packet, 1);
    return SCEncoder.encode(withLength);
  }

  function decodePacket(encodedText) {
    const allBytes = SCEncoder.decode(encodedText);
    if (!allBytes || allBytes.length < 1) return null;
    const packetLength = allBytes[0];
    return allBytes.slice(1, 1 + packetLength);
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
