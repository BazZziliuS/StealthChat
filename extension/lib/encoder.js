/**
 * StealthChat — Byte ↔ Sentence encoder/decoder.
 * Encodes arbitrary bytes into natural-looking sentences.
 * Each sentence encodes 4 bytes (8 words × 4 bits each = 32 bits).
 * Supports multiple languages: encodes in active language, decodes with auto-detection.
 */

const SCEncoder = (() => {

  /**
   * Encode a byte array into sentences using the active encoding language.
   * @param {Uint8Array} bytes
   * @returns {string} Encoded sentences
   */
  function encode(bytes) {
    const wordlist = SC_GET_WORDLIST();
    const sentences = [];

    for (let i = 0; i < bytes.length; i += 4) {
      const chunk = [];
      for (let j = 0; j < 4 && (i + j) < bytes.length; j++) {
        chunk.push(bytes[i + j]);
      }
      while (chunk.length < 4) {
        chunk.push(0);
      }
      sentences.push(bytesToSentence(chunk, wordlist));
    }

    return sentences.join(' ');
  }

  /**
   * Decode sentences back into bytes. Auto-detects language.
   * @param {string} text
   * @param {number} [expectedLength] - If known, trim padding bytes
   * @returns {Uint8Array|null} Decoded bytes
   */
  function decode(text, expectedLength) {
    const lang = SC_DETECT_LANGUAGE(text);
    if (!lang) return null;

    const reverseLookup = SC_GET_REVERSE_LOOKUP(lang);
    const sentences = splitSentences(text);
    const allBytes = [];

    for (const sentence of sentences) {
      const bytes = sentenceToBytes(sentence, reverseLookup);
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
   * Validates the first sentence against ALL supported languages.
   * @param {string} text
   * @returns {boolean}
   */
  function looksEncoded(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const firstDot = trimmed.indexOf('.');
    if (firstDot === -1) return false;

    const firstSentence = trimmed.substring(0, firstDot).trim();
    const words = firstSentence.split(/\s+/);
    if (words.length !== 8) return false;

    // Try each supported language
    for (const [lang, lookups] of Object.entries(SC_REVERSE_LOOKUPS)) {
      let allMatch = true;
      for (let i = 0; i < 8; i++) {
        const category = SC_CATEGORY_ORDER[i];
        const word = words[i].toLowerCase();
        if (lookups[category][word] === undefined) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return true;
    }

    return false;
  }

  // --- Internal helpers ---

  /**
   * Convert 4 bytes into a sentence (8 words) using the given wordlist.
   */
  function bytesToSentence(bytes, wordlist) {
    const words = [];
    for (let i = 0; i < 4; i++) {
      const byte = bytes[i];
      const highNibble = (byte >> 4) & 0x0F;
      const lowNibble = byte & 0x0F;

      const catHigh = SC_CATEGORY_ORDER[i * 2];
      const catLow = SC_CATEGORY_ORDER[i * 2 + 1];

      words.push(wordlist[catHigh][highNibble]);
      words.push(wordlist[catLow][lowNibble]);
    }
    return words.join(' ') + '.';
  }

  /**
   * Convert a sentence back into 4 bytes using the given reverse lookup.
   * @returns {number[]|null} Array of 4 bytes, or null if invalid
   */
  function sentenceToBytes(sentence, reverseLookup) {
    const clean = sentence.replace(/\.$/, '').trim();
    const words = clean.split(/\s+/);

    if (words.length !== 8) return null;

    const bytes = [];
    for (let i = 0; i < 4; i++) {
      const wordHigh = words[i * 2].toLowerCase();
      const wordLow = words[i * 2 + 1].toLowerCase();

      const catHigh = SC_CATEGORY_ORDER[i * 2];
      const catLow = SC_CATEGORY_ORDER[i * 2 + 1];

      const highNibble = reverseLookup[catHigh][wordHigh];
      const lowNibble = reverseLookup[catLow][wordLow];

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
