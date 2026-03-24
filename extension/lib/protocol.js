/**
 * StealthChat — Binary protocol for message packaging.
 *
 * Packet format:
 * [1 byte: version (0x01)]
 * [1 byte: message type]
 * [4 bytes: session ID]
 * [12 bytes: IV/nonce]
 * [N bytes: ciphertext with 16-byte AES-GCM auth tag]
 *
 * For key exchange messages (types 0x02, 0x03):
 * [1 byte: version (0x01)]
 * [1 byte: message type (0x02 or 0x03)]
 * [N bytes: raw public key (65 bytes for P-256 uncompressed)]
 */

const SCProtocol = (() => {

  const VERSION = 0x01;
  const HEADER_SIZE = 18; // 1 + 1 + 4 + 12

  const MessageType = {
    ENCRYPTED_TEXT: 0x01,
    KEY_EXCHANGE_REQUEST: 0x02,
    KEY_EXCHANGE_RESPONSE: 0x03
  };

  /**
   * Build an encrypted message packet.
   * @param {string} sessionId - Hex string (8 chars = 4 bytes)
   * @param {Uint8Array} iv - 12 bytes
   * @param {Uint8Array} ciphertext - Encrypted data with auth tag
   * @returns {Uint8Array}
   */
  function buildEncryptedPacket(sessionId, iv, ciphertext) {
    const sessionBytes = hexToBytes(sessionId);
    if (sessionBytes.length !== 4) throw new Error('Session ID must be 4 bytes');
    if (iv.length !== 12) throw new Error('IV must be 12 bytes');

    const packet = new Uint8Array(HEADER_SIZE + ciphertext.length);
    packet[0] = VERSION;
    packet[1] = MessageType.ENCRYPTED_TEXT;
    packet.set(sessionBytes, 2);
    packet.set(iv, 6);
    packet.set(ciphertext, HEADER_SIZE);
    return packet;
  }

  /**
   * Parse a packet and extract its components.
   * @param {Uint8Array} packet
   * @returns {object|null} Parsed packet or null if invalid
   */
  function parsePacket(packet) {
    if (!packet || packet.length < 2) return null;

    const version = packet[0];
    const type = packet[1];

    if (version !== VERSION) return null;

    // Key exchange packets
    if (type === MessageType.KEY_EXCHANGE_REQUEST || type === MessageType.KEY_EXCHANGE_RESPONSE) {
      return {
        version,
        type,
        publicKeyRaw: packet.slice(2)
      };
    }

    // Encrypted text packet
    if (type === MessageType.ENCRYPTED_TEXT) {
      if (packet.length < HEADER_SIZE + 1) return null;
      return {
        version,
        type,
        sessionId: bytesToHex(packet.slice(2, 6)),
        iv: packet.slice(6, HEADER_SIZE),
        ciphertext: packet.slice(HEADER_SIZE)
      };
    }

    return null;
  }

  /**
   * Build a key exchange packet.
   * @param {Uint8Array} publicKeyRaw - Raw public key bytes
   * @param {boolean} isResponse - true for response (0x03), false for request (0x02)
   * @returns {Uint8Array}
   */
  function buildKeyExchangePacket(publicKeyRaw, isResponse) {
    const packet = new Uint8Array(2 + publicKeyRaw.length);
    packet[0] = VERSION;
    packet[1] = isResponse ? MessageType.KEY_EXCHANGE_RESPONSE : MessageType.KEY_EXCHANGE_REQUEST;
    packet.set(publicKeyRaw, 2);
    return packet;
  }

  /**
   * Quick check: does this packet look like a StealthChat message?
   * @param {Uint8Array} packet
   * @returns {boolean}
   */
  function isValidPacket(packet) {
    if (!packet || packet.length < 2) return false;
    if (packet[0] !== VERSION) return false;
    const type = packet[1];
    return type >= 0x01 && type <= 0x03;
  }

  /**
   * Extract session ID from packet without full parsing.
   * @param {Uint8Array} packet
   * @returns {string|null} Hex session ID
   */
  function extractSessionId(packet) {
    if (!packet || packet.length < 6) return null;
    if (packet[0] !== VERSION || packet[1] !== MessageType.ENCRYPTED_TEXT) return null;
    return bytesToHex(packet.slice(2, 6));
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
