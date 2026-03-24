/**
 * StealthChat — Byte ↔ Sentence encoder/decoder.
 * Encodes arbitrary bytes into natural-looking English sentences.
 * Each sentence encodes 4 bytes (8 words × 4 bits each = 32 bits).
 */

const SCEncoder = (() => {

  /**
   * Encode a byte array into English sentences.
   * @param {Uint8Array} bytes
   * @returns {string} Encoded sentences
   */
  function encode(bytes) {
    const sentences = [];

    // Process 4 bytes at a time (one sentence per 4 bytes)
    for (let i = 0; i < bytes.length; i += 4) {
      const chunk = [];
      for (let j = 0; j < 4 && (i + j) < bytes.length; j++) {
        chunk.push(bytes[i + j]);
      }
      // Pad with zeros if last chunk is incomplete
      while (chunk.length < 4) {
        chunk.push(0);
      }
      sentences.push(bytesToSentence(chunk));
    }

    return sentences.join(' ');
  }

  /**
   * Decode English sentences back into bytes.
   * @param {string} text
   * @param {number} [expectedLength] - If known, trim padding bytes
   * @returns {Uint8Array} Decoded bytes
   */
  function decode(text, expectedLength) {
    const sentences = splitSentences(text);
    const allBytes = [];

    for (const sentence of sentences) {
      const bytes = sentenceToBytes(sentence);
      if (bytes === null) return null;
      allBytes.push(...bytes);
    }

    if (expectedLength !== undefined && expectedLength <= allBytes.length) {
      return new Uint8Array(allBytes.slice(0, expectedLength));
    }
    return new Uint8Array(allBytes);
  }

  /**
   * Check if text looks like a StealthChat encoded message.
   * Validates that the first sentence matches the word template:
   * Name adverb verb article adjective noun preposition time.
   * @param {string} text
   * @returns {boolean}
   */
  function looksEncoded(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Must contain at least one period (sentence terminator)
    const firstDot = trimmed.indexOf('.');
    if (firstDot === -1) return false;

    // First sentence must have exactly 8 words
    const firstSentence = trimmed.substring(0, firstDot).trim();
    const words = firstSentence.split(/\s+/);
    if (words.length !== 8) return false;

    // Validate each word belongs to its expected category
    for (let i = 0; i < 8; i++) {
      const category = SC_CATEGORY_ORDER[i];
      const word = words[i].toLowerCase();
      if (SC_REVERSE_LOOKUP[category][word] === undefined) return false;
    }

    return true;
  }

  // --- Internal helpers ---

  /**
   * Convert 4 bytes into a sentence (8 words).
   * Each byte → 2 words (high nibble, low nibble).
   */
  function bytesToSentence(bytes) {
    const words = [];
    for (let i = 0; i < 4; i++) {
      const byte = bytes[i];
      const highNibble = (byte >> 4) & 0x0F;
      const lowNibble = byte & 0x0F;

      const catHigh = SC_CATEGORY_ORDER[i * 2];
      const catLow = SC_CATEGORY_ORDER[i * 2 + 1];

      words.push(SC_WORDLIST[catHigh][highNibble]);
      words.push(SC_WORDLIST[catLow][lowNibble]);
    }
    return words.join(' ') + '.';
  }

  /**
   * Convert a sentence back into 4 bytes.
   * @returns {number[]|null} Array of 4 bytes, or null if invalid
   */
  function sentenceToBytes(sentence) {
    const clean = sentence.replace(/\.$/, '').trim();
    const words = clean.split(/\s+/);

    if (words.length !== 8) return null;

    const bytes = [];
    for (let i = 0; i < 4; i++) {
      const wordHigh = words[i * 2].toLowerCase();
      const wordLow = words[i * 2 + 1].toLowerCase();

      const catHigh = SC_CATEGORY_ORDER[i * 2];
      const catLow = SC_CATEGORY_ORDER[i * 2 + 1];

      const highNibble = SC_REVERSE_LOOKUP[catHigh][wordHigh];
      const lowNibble = SC_REVERSE_LOOKUP[catLow][wordLow];

      if (highNibble === undefined || lowNibble === undefined) return null;

      bytes.push((highNibble << 4) | lowNibble);
    }
    return bytes;
  }

  /**
   * Split encoded text into individual sentences.
   */
  function splitSentences(text) {
    return text.split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + '.');
  }

  return { encode, decode, looksEncoded };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCEncoder;
}
