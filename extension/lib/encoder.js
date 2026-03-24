/**
 * StealthChat — Byte ↔ Sentence encoder/decoder.
 * Encodes arbitrary bytes into natural-looking sentences.
 * Each sentence encodes 5 bytes (8 words × 5 bits each = 40 bits).
 * Supports multiple languages: encodes in active language, decodes with auto-detection.
 */

const SCEncoder = (() => {

  const BITS_PER_WORD = 5;
  const WORDS_PER_SENTENCE = 8;
  const BITS_PER_SENTENCE = BITS_PER_WORD * WORDS_PER_SENTENCE; // 40
  const BYTES_PER_SENTENCE = BITS_PER_SENTENCE / 8; // 5

  /**
   * Encode a byte array into sentences using the active encoding language.
   * @param {Uint8Array} bytes
   * @returns {string} Encoded sentences
   */
  function encode(bytes) {
    const wordlist = SC_GET_WORDLIST();
    const sentences = [];

    for (let i = 0; i < bytes.length; i += BYTES_PER_SENTENCE) {
      const chunk = [];
      for (let j = 0; j < BYTES_PER_SENTENCE && (i + j) < bytes.length; j++) {
        chunk.push(bytes[i + j]);
      }
      while (chunk.length < BYTES_PER_SENTENCE) {
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
    if (words.length !== WORDS_PER_SENTENCE) return false;

    for (const [lang, lookups] of Object.entries(SC_REVERSE_LOOKUPS)) {
      let allMatch = true;
      for (let i = 0; i < WORDS_PER_SENTENCE; i++) {
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
   * Convert 5 bytes into a sentence (8 words × 5 bits each).
   * Packs bytes into a 40-bit stream, extracts 8 groups of 5 bits.
   */
  function bytesToSentence(bytes, wordlist) {
    const indices = bytesToIndices(bytes);
    const words = [];
    for (let i = 0; i < WORDS_PER_SENTENCE; i++) {
      const cat = SC_CATEGORY_ORDER[i];
      words.push(wordlist[cat][indices[i]]);
    }
    return words.join(' ') + '.';
  }

  /**
   * Convert a sentence back into 5 bytes.
   * @returns {number[]|null} Array of 5 bytes, or null if invalid
   */
  function sentenceToBytes(sentence, reverseLookup) {
    const clean = sentence.replace(/\.$/, '').trim();
    const words = clean.split(/\s+/);

    if (words.length !== WORDS_PER_SENTENCE) return null;

    const indices = [];
    for (let i = 0; i < WORDS_PER_SENTENCE; i++) {
      const cat = SC_CATEGORY_ORDER[i];
      const idx = reverseLookup[cat][words[i].toLowerCase()];
      if (idx === undefined) return null;
      indices.push(idx);
    }

    return indicesToBytes(indices);
  }

  /**
   * Pack 5 bytes into 8 × 5-bit indices.
   */
  function bytesToIndices(bytes) {
    let buffer = 0;
    let bitsInBuffer = 0;
    const indices = [];
    let byteIdx = 0;

    for (let w = 0; w < WORDS_PER_SENTENCE; w++) {
      while (bitsInBuffer < BITS_PER_WORD && byteIdx < bytes.length) {
        buffer = (buffer << 8) | bytes[byteIdx++];
        bitsInBuffer += 8;
      }
      const idx = (buffer >> (bitsInBuffer - BITS_PER_WORD)) & 0x1F;
      bitsInBuffer -= BITS_PER_WORD;
      buffer &= (1 << bitsInBuffer) - 1;
      indices.push(idx);
    }

    return indices;
  }

  /**
   * Unpack 8 × 5-bit indices into 5 bytes.
   */
  function indicesToBytes(indices) {
    let buffer = 0;
    let bitsInBuffer = 0;
    const bytes = [];

    for (const idx of indices) {
      buffer = (buffer << BITS_PER_WORD) | (idx & 0x1F);
      bitsInBuffer += BITS_PER_WORD;
      while (bitsInBuffer >= 8) {
        bytes.push((buffer >> (bitsInBuffer - 8)) & 0xFF);
        bitsInBuffer -= 8;
        buffer &= (1 << bitsInBuffer) - 1;
      }
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
