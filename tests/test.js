/**
 * StealthChat — Unit tests for lib modules.
 * Run with: node tests/test.js
 *
 * Uses Node.js built-in crypto.subtle (available since Node 15+).
 */

// Polyfill browser globals for Node.js environment
const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;
globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

// Load modules — assign exports to globals (simulating browser script loading)
const i18nExports = require('../extension/lib/i18n.js');
globalThis.SCI18n = i18nExports;

const wordlistExports = require('../extension/lib/wordlist.js');
globalThis.SC_WORDLISTS = wordlistExports.SC_WORDLISTS;
globalThis.SC_CATEGORY_ORDER = wordlistExports.SC_CATEGORY_ORDER;
globalThis.SC_REVERSE_LOOKUPS = wordlistExports.SC_REVERSE_LOOKUPS;
globalThis.SC_MARKER_WORD = wordlistExports.SC_MARKER_WORD;
globalThis.SC_SET_ENCODING_LANG = wordlistExports.SC_SET_ENCODING_LANG;
globalThis.SC_GET_ENCODING_LANG = wordlistExports.SC_GET_ENCODING_LANG;
globalThis.SC_GET_WORDLIST = wordlistExports.SC_GET_WORDLIST;
globalThis.SC_GET_REVERSE_LOOKUP = wordlistExports.SC_GET_REVERSE_LOOKUP;
globalThis.SC_DETECT_LANGUAGE = wordlistExports.SC_DETECT_LANGUAGE;

globalThis.SCEncoder = require('../extension/lib/encoder.js');
globalThis.SCProtocol = require('../extension/lib/protocol.js');
globalThis.SCCrypto = require('../extension/lib/crypto.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertEq(actual, expected, message) {
  const eq = JSON.stringify(actual) === JSON.stringify(expected);
  if (!eq) {
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
  }
  assert(eq, message);
}

async function runTests() {
  console.log('\n=== StealthChat Tests ===\n');

  // --- Wordlist ---
  console.log('Wordlist (English):');
  const enWordlist = SC_WORDLISTS.en;
  assert(enWordlist.names.length === 16, 'EN names has 16 entries');
  assert(enWordlist.adverbs.length === 16, 'EN adverbs has 16 entries');
  assert(enWordlist.verbs.length === 16, 'EN verbs has 16 entries');
  assert(enWordlist.articles.length === 16, 'EN articles has 16 entries');
  assert(enWordlist.adjectives.length === 16, 'EN adjectives has 16 entries');
  assert(enWordlist.nouns.length === 16, 'EN nouns has 16 entries');
  assert(enWordlist.prepositions.length === 16, 'EN prepositions has 16 entries');
  assert(enWordlist.timeWords.length === 16, 'EN timeWords has 16 entries');

  console.log('\nWordlist (Russian):');
  const ruWordlist = SC_WORDLISTS.ru;
  assert(ruWordlist.names.length === 16, 'RU names has 16 entries');
  assert(ruWordlist.adverbs.length === 16, 'RU adverbs has 16 entries');
  assert(ruWordlist.verbs.length === 16, 'RU verbs has 16 entries');
  assert(ruWordlist.articles.length === 16, 'RU articles has 16 entries');
  assert(ruWordlist.adjectives.length === 16, 'RU adjectives has 16 entries');
  assert(ruWordlist.nouns.length === 16, 'RU nouns has 16 entries');
  assert(ruWordlist.prepositions.length === 16, 'RU prepositions has 16 entries');
  assert(ruWordlist.timeWords.length === 16, 'RU timeWords has 16 entries');

  assert(SC_CATEGORY_ORDER.length === 8, 'category order has 8 entries');
  assert(SC_MARKER_WORD === 'alice', 'marker word is "alice"');

  // Language detection
  console.log('\nLanguage Detection:');
  assert(SC_DETECT_LANGUAGE('Alice slowly brought the bright bridge about Monday.') === 'en', 'detects English');
  assert(SC_DETECT_LANGUAGE('Алиса быстро принес этот яркий мост через понедельник.') === 'ru', 'detects Russian');
  assert(SC_DETECT_LANGUAGE('Hello world') === null, 'returns null for unknown');

  // --- Encoder (English) ---
  console.log('\nEncoder (English):');
  SC_SET_ENCODING_LANG('en');

  // Encode/decode round-trip for 4 bytes
  const testBytes4 = new Uint8Array([0x01, 0x01, 0xA3, 0x5F]);
  const encoded4 = SCEncoder.encode(testBytes4);
  assert(typeof encoded4 === 'string', 'encode returns string');
  assert(encoded4.includes('.'), 'encoded text contains periods');

  const decoded4 = SCEncoder.decode(encoded4, 4);
  assertEq(Array.from(decoded4), [0x01, 0x01, 0xA3, 0x5F], 'decode round-trip (4 bytes)');

  // Known encoding: byte 0x01 → names[0]=Alice, adverbs[1]=slowly
  assert(encoded4.startsWith('Alice slowly'), 'byte 0x01 encodes to "Alice slowly..."');

  // Encode/decode with padding (3 bytes → padded to 4)
  const testBytes3 = new Uint8Array([0xFF, 0x00, 0x80]);
  const encoded3 = SCEncoder.encode(testBytes3);
  const decoded3 = SCEncoder.decode(encoded3, 3);
  assertEq(Array.from(decoded3), [0xFF, 0x00, 0x80], 'decode round-trip (3 bytes with padding)');

  // Larger data (multiple sentences)
  const testBytes12 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const encoded12 = SCEncoder.encode(testBytes12);
  const sentences = encoded12.split('.').filter(s => s.trim());
  assert(sentences.length === 3, '12 bytes encodes to 3 sentences');
  const decoded12 = SCEncoder.decode(encoded12, 12);
  assertEq(Array.from(decoded12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'decode round-trip (12 bytes)');

  // looksEncoded
  assert(SCEncoder.looksEncoded(encoded4), 'looksEncoded returns true for encoded text');
  assert(SCEncoder.looksEncoded(encoded12), 'looksEncoded returns true for multi-sentence');
  assert(!SCEncoder.looksEncoded('Hello world'), 'looksEncoded returns false for normal text');
  assert(!SCEncoder.looksEncoded('Alice went to the store'), 'looksEncoded false for non-matching structure');
  assert(!SCEncoder.looksEncoded(''), 'looksEncoded false for empty string');

  // --- Encoder (Russian) ---
  console.log('\nEncoder (Russian):');
  SC_SET_ENCODING_LANG('ru');

  const ruEncoded4 = SCEncoder.encode(testBytes4);
  assert(typeof ruEncoded4 === 'string', 'RU encode returns string');
  assert(ruEncoded4.includes('.'), 'RU encoded text contains periods');
  assert(ruEncoded4.startsWith('Алиса'), 'RU byte 0x0_ starts with Алиса');

  const ruDecoded4 = SCEncoder.decode(ruEncoded4, 4);
  assertEq(Array.from(ruDecoded4), [0x01, 0x01, 0xA3, 0x5F], 'RU decode round-trip (4 bytes)');

  // RU looksEncoded
  assert(SCEncoder.looksEncoded(ruEncoded4), 'looksEncoded returns true for RU encoded text');

  // Cross-language: encode in RU, decode should auto-detect
  const ruEncoded12 = SCEncoder.encode(testBytes12);
  const ruDecoded12 = SCEncoder.decode(ruEncoded12, 12);
  assertEq(Array.from(ruDecoded12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'RU decode round-trip (12 bytes)');

  // Switch back to EN and decode RU text (auto-detection)
  SC_SET_ENCODING_LANG('en');
  const crossDecoded = SCEncoder.decode(ruEncoded4, 4);
  assertEq(Array.from(crossDecoded), [0x01, 0x01, 0xA3, 0x5F], 'cross-lang: EN active, decodes RU text');

  // --- Protocol ---
  console.log('\nProtocol:');

  // Encrypted packet
  const iv = new Uint8Array(12).fill(0xAA);
  const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
  const packet = SCProtocol.buildEncryptedPacket('a3b5c7d9', iv, ciphertext);
  assert(packet[0] === 0x01, 'packet version is 0x01');
  assert(packet[1] === 0x01, 'packet type is ENCRYPTED_TEXT');
  assert(packet.length === 18 + 5, 'packet length = header + ciphertext');

  const parsed = SCProtocol.parsePacket(packet);
  assert(parsed !== null, 'parsePacket succeeds');
  assertEq(parsed.version, 0x01, 'parsed version');
  assertEq(parsed.type, SCProtocol.MessageType.ENCRYPTED_TEXT, 'parsed type');
  assertEq(parsed.sessionId, 'a3b5c7d9', 'parsed session ID');
  assertEq(Array.from(parsed.iv), Array.from(iv), 'parsed IV');
  assertEq(Array.from(parsed.ciphertext), [1, 2, 3, 4, 5], 'parsed ciphertext');

  // Key exchange packet
  const pubKeyRaw = new Uint8Array(65).fill(0x04); // Fake uncompressed P-256 key
  const kexPacket = SCProtocol.buildKeyExchangePacket(pubKeyRaw, false);
  assert(kexPacket[0] === 0x01, 'kex packet version');
  assert(kexPacket[1] === 0x02, 'kex packet type is REQUEST');

  const kexParsed = SCProtocol.parsePacket(kexPacket);
  assert(kexParsed.type === SCProtocol.MessageType.KEY_EXCHANGE_REQUEST, 'kex parsed type');
  assertEq(kexParsed.publicKeyRaw.length, 65, 'kex parsed key length');

  // Session ID extraction
  const sid = SCProtocol.extractSessionId(packet);
  assertEq(sid, 'a3b5c7d9', 'extractSessionId');

  // Invalid packets
  assert(SCProtocol.parsePacket(new Uint8Array([0x02, 0x01])) === null, 'reject wrong version');
  assert(SCProtocol.parsePacket(new Uint8Array([0x01, 0x05])) === null, 'reject unknown type');

  // --- Crypto ---
  console.log('\nCrypto:');

  // Key generation
  const keyPairA = await SCCrypto.generateKeyPair();
  assert(keyPairA.publicKey !== undefined, 'generates public key');
  assert(keyPairA.privateKey !== undefined, 'generates private key');

  // Export/import raw public key
  const rawPub = await SCCrypto.exportPublicKeyRaw(keyPairA.publicKey);
  assert(rawPub.length === 65, 'raw public key is 65 bytes (uncompressed P-256)');
  const importedPub = await SCCrypto.importPublicKeyRaw(rawPub);
  assert(importedPub !== undefined, 'import raw public key succeeds');

  // Export/import JWK key pair
  const jwk = await SCCrypto.exportKeyPairJWK(keyPairA);
  assert(jwk.publicKey.kty === 'EC', 'JWK export has EC type');
  const reimported = await SCCrypto.importKeyPairJWK(jwk);
  assert(reimported.publicKey !== undefined, 'JWK reimport succeeds');

  // ECDH key exchange
  const keyPairB = await SCCrypto.generateKeyPair();
  const sharedKeyA = await SCCrypto.deriveSharedKey(keyPairA.privateKey, keyPairB.publicKey);
  const sharedKeyB = await SCCrypto.deriveSharedKey(keyPairB.privateKey, keyPairA.publicKey);

  const sessionIdA = await SCCrypto.computeSessionId(sharedKeyA);
  const sessionIdB = await SCCrypto.computeSessionId(sharedKeyB);
  assertEq(sessionIdA, sessionIdB, 'both sides derive same session ID');
  assert(sessionIdA.length === 8, 'session ID is 8 hex chars');

  // AES key export/import
  const exportedKey = await SCCrypto.exportAESKey(sharedKeyA);
  assert(typeof exportedKey === 'string', 'exported AES key is base64 string');
  const reimportedKey = await SCCrypto.importAESKey(exportedKey);
  assert(reimportedKey !== undefined, 'AES key reimport succeeds');

  // Encrypt/decrypt
  const plaintext = 'Hello, StealthChat! Привет мир! 🔒';
  const { iv: encIv, ciphertext: encCiphertext } = await SCCrypto.encrypt(plaintext, sharedKeyA);
  assert(encIv.length === 12, 'IV is 12 bytes');
  assert(encCiphertext.length > 0, 'ciphertext is non-empty');

  const decrypted = await SCCrypto.decrypt(encCiphertext, encIv, sharedKeyB);
  assertEq(decrypted, plaintext, 'decrypt recovers plaintext (cross-key)');

  // Full pipeline: encryptAndEncode → decodeAndDecrypt (English)
  console.log('\nFull Pipeline (English):');
  SC_SET_ENCODING_LANG('en');
  const message = 'This is a secret message! Секретное сообщение 🕵️';
  const sessionId = sessionIdA;

  const encodedMsg = await SCCrypto.encryptAndEncode(message, sharedKeyA, sessionId);
  assert(typeof encodedMsg === 'string', 'encryptAndEncode returns string');
  assert(SCEncoder.looksEncoded(encodedMsg), 'encoded message passes looksEncoded check');
  assert(SC_DETECT_LANGUAGE(encodedMsg) === 'en', 'pipeline output detected as English');

  const msgPacket = SCCrypto.decodePacket(encodedMsg);
  const msgSessionId = SCProtocol.extractSessionId(msgPacket);
  assertEq(msgSessionId, sessionId, 'encoded message contains correct session ID');

  const decryptedMsg = await SCCrypto.decodeAndDecrypt(encodedMsg, sharedKeyB);
  assertEq(decryptedMsg, message, 'full pipeline round-trip preserves message (EN)');

  // Full pipeline: encryptAndEncode → decodeAndDecrypt (Russian)
  console.log('\nFull Pipeline (Russian):');
  SC_SET_ENCODING_LANG('ru');
  const ruMessage = 'Тестовое секретное сообщение! 🔐';

  const ruEncodedMsg = await SCCrypto.encryptAndEncode(ruMessage, sharedKeyA, sessionId);
  assert(typeof ruEncodedMsg === 'string', 'RU encryptAndEncode returns string');
  assert(SCEncoder.looksEncoded(ruEncodedMsg), 'RU encoded message passes looksEncoded check');
  assert(SC_DETECT_LANGUAGE(ruEncodedMsg) === 'ru', 'pipeline output detected as Russian');

  const ruDecryptedMsg = await SCCrypto.decodeAndDecrypt(ruEncodedMsg, sharedKeyB);
  assertEq(ruDecryptedMsg, ruMessage, 'full pipeline round-trip preserves message (RU)');

  // Cross-language: encode in RU, decode with EN active
  SC_SET_ENCODING_LANG('en');
  const crossDecryptedMsg = await SCCrypto.decodeAndDecrypt(ruEncodedMsg, sharedKeyB);
  assertEq(crossDecryptedMsg, ruMessage, 'cross-lang: decode RU message with EN active');

  // Wrong key should fail
  const keyPairC = await SCCrypto.generateKeyPair();
  const wrongKey = await SCCrypto.deriveSharedKey(keyPairC.privateKey, keyPairA.publicKey);
  try {
    await SCCrypto.decodeAndDecrypt(encodedMsg, wrongKey);
    assert(false, 'wrong key should throw');
  } catch {
    assert(true, 'wrong key throws decryption error');
  }

  // --- i18n ---
  console.log('\ni18n:');
  SCI18n.setLanguage('en');
  assertEq(SCI18n.t('status.active'), 'Encryption active', 'EN translation works');
  SCI18n.setLanguage('ru');
  assertEq(SCI18n.t('status.active'), 'Шифрование активно', 'RU translation works');
  assertEq(SCI18n.getAvailableLanguages().sort(), ['en', 'ru'], 'available languages');

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
