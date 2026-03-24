/**
 * StealthChat — Binary protocol v2 for message packaging.
 *
 * v2 Encrypted message (compact):
 * [1 byte: version (0x02)]
 * [1 byte: flags — bit 7: compressed, bits 0-3: message type]
 * [2 bytes: session ID]
 * [12 bytes: IV/nonce]
 * [N bytes: ciphertext with 8-byte AES-GCM auth tag]
 *
 * v2 Key exchange (unchanged structure):
 * [1 byte: version (0x02)]
 * [1 byte: flags — type 0x02 or 0x03]
 * [N bytes: raw public key (65 bytes for P-256)]
 *
 * Savings vs v1: session ID 4→2 bytes, auth tag 16→8 bytes = -10 bytes/message
 */

const SCProtocol = (() => {

  const VERSION = 0x02;
  const HEADER_SIZE = 16; // 1 + 1 + 2 + 12

  const MessageType = {
    ENCRYPTED_TEXT: 0x01,
    KEY_EXCHANGE_REQUEST: 0x02,
    KEY_EXCHANGE_RESPONSE: 0x03
  };

  const FLAGS_COMPRESSED = 0x80; // bit 7

  /**
   * Build an encrypted message packet (v2).
   * @param {string} sessionId - Hex string (4 chars = 2 bytes)
   * @param {Uint8Array} iv - 12 bytes
   * @param {Uint8Array} ciphertext - Encrypted data with 8-byte auth tag
   * @param {boolean} compressed - Whether plaintext was compressed before encryption
   * @returns {Uint8Array}
   */
  function buildEncryptedPacket(sessionId, iv, ciphertext, compressed) {
    // Use first 2 bytes of session ID (4 hex chars)
    const sidHex = sessionId.slice(0, 4);
    const sessionBytes = hexToBytes(sidHex);
    if (iv.length !== 12) throw new Error('IV must be 12 bytes');

    const flags = MessageType.ENCRYPTED_TEXT | (compressed ? FLAGS_COMPRESSED : 0);

    const packet = new Uint8Array(HEADER_SIZE + ciphertext.length);
    packet[0] = VERSION;
    packet[1] = flags;
    packet.set(sessionBytes, 2);
    packet.set(iv, 4);
    packet.set(ciphertext, HEADER_SIZE);
    return packet;
  }

  /**
   * Parse a packet and extract its components.
   * @param {Uint8Array} packet
   * @returns {object|null}
   */
  function parsePacket(packet) {
    if (!packet || packet.length < 2) return null;

    const version = packet[0];
    if (version !== VERSION) return null;

    const flags = packet[1];
    const type = flags & 0x0F;
    const compressed = !!(flags & FLAGS_COMPRESSED);

    // Key exchange packets
    if (type === MessageType.KEY_EXCHANGE_REQUEST || type === MessageType.KEY_EXCHANGE_RESPONSE) {
      return {
        version,
        type,
        compressed: false,
        publicKeyRaw: packet.slice(2)
      };
    }

    // Encrypted text packet
    if (type === MessageType.ENCRYPTED_TEXT) {
      if (packet.length < HEADER_SIZE + 1) return null;
      return {
        version,
        type,
        compressed,
        sessionId: bytesToHex(packet.slice(2, 4)),
        iv: packet.slice(4, HEADER_SIZE),
        ciphertext: packet.slice(HEADER_SIZE)
      };
    }

    return null;
  }

  /**
   * Build a key exchange packet.
   */
  function buildKeyExchangePacket(publicKeyRaw, isResponse) {
    const packet = new Uint8Array(2 + publicKeyRaw.length);
    packet[0] = VERSION;
    packet[1] = isResponse ? MessageType.KEY_EXCHANGE_RESPONSE : MessageType.KEY_EXCHANGE_REQUEST;
    packet.set(publicKeyRaw, 2);
    return packet;
  }

  /**
   * Quick check: does this look like a valid StealthChat packet?
   */
  function isValidPacket(packet) {
    if (!packet || packet.length < 2) return false;
    if (packet[0] !== VERSION) return false;
    const type = packet[1] & 0x0F;
    return type >= 0x01 && type <= 0x03;
  }

  /**
   * Extract session ID from packet without full parsing.
   * @returns {string|null} Hex session ID (4 chars)
   */
  function extractSessionId(packet) {
    if (!packet || packet.length < 4) return null;
    if (packet[0] !== VERSION) return null;
    if ((packet[1] & 0x0F) !== MessageType.ENCRYPTED_TEXT) return null;
    return bytesToHex(packet.slice(2, 4));
  }

  // --- Hex helpers ---

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return {
    VERSION,
    MessageType,
    HEADER_SIZE,
    FLAGS_COMPRESSED,
    buildEncryptedPacket,
    buildKeyExchangePacket,
    parsePacket,
    isValidPacket,
    extractSessionId,
    hexToBytes,
    bytesToHex
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCProtocol;
}
