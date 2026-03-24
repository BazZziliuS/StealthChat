/**
 * StealthChat — Unit tests for lib modules.
 * Run with: node tests/test.js
 */

const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;
globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

// Load modules
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

  // --- Wordlist validation for all languages ---
  const languages = ['en', 'ru', 'uk', 'de', 'be', 'fa', 'kk'];

  for (const lang of languages) {
    console.log(`Wordlist (${lang.toUpperCase()}):`);
    const wl = SC_WORDLISTS[lang];
    for (const cat of SC_CATEGORY_ORDER) {
      assert(wl[cat].length === 32, `${lang} ${cat} has 32 entries`);
    }
  }

  // Verify no name collisions across languages
  console.log('\nName uniqueness across languages:');
  const allNames = new Map();
  let nameCollision = false;
  for (const lang of languages) {
    for (const name of SC_WORDLISTS[lang].names) {
      const lower = name.toLowerCase();
      if (allNames.has(lower)) {
        console.error(`  ✗ Name collision: "${name}" in ${lang} and ${allNames.get(lower)}`);
        nameCollision = true;
      }
      allNames.set(lower, lang);
    }
  }
  assert(!nameCollision, 'no name collisions across languages');

  // Verify no duplicate words within any single category
  console.log('\nNo duplicate words within categories:');
  let hasDuplicates = false;
  for (const lang of languages) {
    const wl = SC_WORDLISTS[lang];
    for (const cat of SC_CATEGORY_ORDER) {
      const words = wl[cat].map(w => w.toLowerCase());
      const unique = new Set(words);
      if (unique.size !== words.length) {
        const seen = new Set();
        for (const w of words) {
          if (seen.has(w)) {
            console.error(`  ✗ Duplicate "${w}" in ${lang}.${cat}`);
            hasDuplicates = true;
          }
          seen.add(w);
        }
      }
    }
  }
  assert(!hasDuplicates, 'no duplicate words within any category');

  // Verify no word appears in two different categories within same language
  console.log('\nNo cross-category duplicates within a language:');
  let hasCrossDup = false;
  for (const lang of languages) {
    const wl = SC_WORDLISTS[lang];
    const allWords = new Map();
    for (const cat of SC_CATEGORY_ORDER) {
      for (const w of wl[cat]) {
        const lower = w.toLowerCase();
        if (allWords.has(lower)) {
          console.error(`  ✗ "${w}" in ${lang}.${allWords.get(lower)} and ${lang}.${cat}`);
          hasCrossDup = true;
        }
        allWords.set(lower, cat);
      }
    }
  }
  assert(!hasCrossDup, 'no cross-category duplicates within any language');

  // Language detection
  console.log('\nLanguage Detection:');
  assert(SC_DETECT_LANGUAGE('Alice slowly brought the bright bridge about Monday.') === 'en', 'detects English');
  assert(SC_DETECT_LANGUAGE('Алиса быстро принес этот яркий мост через понедельник.') === 'ru', 'detects Russian');
  assert(SC_DETECT_LANGUAGE('Оксана швидко приніс цей яскравий міст через понеділок.') === 'uk', 'detects Ukrainian');
  assert(SC_DETECT_LANGUAGE('Annika schnell brachte der hell Brücke über Montag.') === 'de', 'detects German');
  assert(SC_DETECT_LANGUAGE('Hello world') === null, 'returns null for unknown');

  // --- Encoder round-trip for each language ---
  // 5 bytes per sentence now (8 words × 5 bits = 40 bits)
  const testBytes5 = new Uint8Array([0x01, 0x01, 0xA3, 0x5F, 0xBC]);
  const testBytes15 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

  for (const lang of languages) {
    console.log(`\nEncoder (${lang.toUpperCase()}):`);
    SC_SET_ENCODING_LANG(lang);

    const encoded5 = SCEncoder.encode(testBytes5);
    assert(typeof encoded5 === 'string', `${lang} encode returns string`);
    assert(encoded5.includes('.'), `${lang} encoded text contains periods`);

    const decoded5 = SCEncoder.decode(encoded5, 5);
    assertEq(Array.from(decoded5), [0x01, 0x01, 0xA3, 0x5F, 0xBC], `${lang} decode round-trip (5 bytes)`);

    assert(SCEncoder.looksEncoded(encoded5), `${lang} looksEncoded returns true`);

    // Multi-sentence (15 bytes = 3 sentences × 5 bytes)
    const encoded15 = SCEncoder.encode(testBytes15);
    const sentences = encoded15.split('.').filter(s => s.trim());
    assert(sentences.length === 3, `${lang} 15 bytes encodes to 3 sentences`);
    const decoded15 = SCEncoder.decode(encoded15, 15);
    assertEq(Array.from(decoded15), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], `${lang} decode round-trip (15 bytes)`);

    // Detected language matches
    assert(SC_DETECT_LANGUAGE(encoded5) === lang, `${lang} encoded text detected as ${lang}`);
  }

  // Cross-language decoding
  console.log('\nCross-language decoding:');
  SC_SET_ENCODING_LANG('ru');
  const ruEncoded = SCEncoder.encode(testBytes5);
  SC_SET_ENCODING_LANG('en');
  const crossDecoded = SCEncoder.decode(ruEncoded, 5);
  assertEq(Array.from(crossDecoded), [0x01, 0x01, 0xA3, 0x5F, 0xBC], 'decode RU text with EN active');

  SC_SET_ENCODING_LANG('de');
  const deEncoded = SCEncoder.encode(testBytes5);
  SC_SET_ENCODING_LANG('uk');
  const crossDecoded2 = SCEncoder.decode(deEncoded, 5);
  assertEq(Array.from(crossDecoded2), [0x01, 0x01, 0xA3, 0x5F, 0xBC], 'decode DE text with UK active');

  // looksEncoded negatives
  assert(!SCEncoder.looksEncoded('Hello world'), 'looksEncoded false for normal text');
  assert(!SCEncoder.looksEncoded(''), 'looksEncoded false for empty');

  // --- Protocol v2 ---
  console.log('\nProtocol v2:');
  const iv = new Uint8Array(12).fill(0xAA);
  const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
  const packet = SCProtocol.buildEncryptedPacket('a3b5', iv, ciphertext, false);
  assert(packet[0] === 0x02, 'packet version is 0x02');
  assert((packet[1] & 0x0F) === 0x01, 'packet type is ENCRYPTED_TEXT');
  assert(!(packet[1] & 0x80), 'compressed flag is off');
  assert(packet.length === 16 + 5, 'packet length = header(16) + ciphertext');

  const parsed = SCProtocol.parsePacket(packet);
  assert(parsed !== null, 'parsePacket succeeds');
  assertEq(parsed.sessionId, 'a3b5', 'parsed session ID (4 hex chars)');
  assertEq(parsed.compressed, false, 'parsed compressed flag');

  // Compressed packet
  const compPacket = SCProtocol.buildEncryptedPacket('a3b5', iv, ciphertext, true);
  assert(!!(compPacket[1] & 0x80), 'compressed flag is on');
  const compParsed = SCProtocol.parsePacket(compPacket);
  assertEq(compParsed.compressed, true, 'parsed compressed=true');

  const kexPacket = SCProtocol.buildKeyExchangePacket(new Uint8Array(65).fill(0x04), false);
  assert(kexPacket[1] === 0x02, 'kex type is REQUEST');

  assert(SCProtocol.parsePacket(new Uint8Array([0x01, 0x01])) === null, 'reject old version');
  assert(SCProtocol.parsePacket(new Uint8Array([0x02, 0x05])) === null, 'reject unknown type');

  // --- Crypto ---
  console.log('\nCrypto:');
  const keyPairA = await SCCrypto.generateKeyPair();
  const keyPairB = await SCCrypto.generateKeyPair();
  assert(keyPairA.publicKey !== undefined, 'generates key pair A');
  assert(keyPairB.publicKey !== undefined, 'generates key pair B');

  const rawPub = await SCCrypto.exportPublicKeyRaw(keyPairA.publicKey);
  assert(rawPub.length === 65, 'raw public key is 65 bytes');

  const sharedKeyA = await SCCrypto.deriveSharedKey(keyPairA.privateKey, keyPairB.publicKey);
  const sharedKeyB = await SCCrypto.deriveSharedKey(keyPairB.privateKey, keyPairA.publicKey);
  const sessionIdA = await SCCrypto.computeSessionId(sharedKeyA);
  const sessionIdB = await SCCrypto.computeSessionId(sharedKeyB);
  assertEq(sessionIdA, sessionIdB, 'both sides derive same session ID');
  assert(sessionIdA.length === 4, 'session ID is 4 hex chars (v2)');

  const plaintext = 'Hello StealthChat! Привет мир! 🔒 Тест українською. Auf Deutsch!';
  const { iv: encIv, ciphertext: encCiphertext, compressed: wasCompressed } = await SCCrypto.encrypt(plaintext, sharedKeyA);
  assert(typeof wasCompressed === 'boolean', 'encrypt returns compressed flag');
  const decrypted = await SCCrypto.decrypt(encCiphertext, encIv, sharedKeyB, wasCompressed);
  assertEq(decrypted, plaintext, 'encrypt/decrypt round-trip');

  // Full pipeline per language
  const sessionId = sessionIdA;

  for (const lang of languages) {
    console.log(`\nFull Pipeline (${lang.toUpperCase()}):`);
    SC_SET_ENCODING_LANG(lang);
    const msg = `Secret message in ${lang}! Тест 🔐`;
    const encoded = await SCCrypto.encryptAndEncode(msg, sharedKeyA, sessionId);
    assert(SCEncoder.looksEncoded(encoded), `${lang} pipeline output passes looksEncoded`);
    assert(SC_DETECT_LANGUAGE(encoded) === lang, `${lang} pipeline output detected correctly`);

    // Decode with different active language
    SC_SET_ENCODING_LANG(lang === 'en' ? 'ru' : 'en');
    const dec = await SCCrypto.decodeAndDecrypt(encoded, sharedKeyB);
    assertEq(dec, msg, `${lang} cross-lang pipeline round-trip`);
  }

  // Wrong key
  const keyPairC = await SCCrypto.generateKeyPair();
  const wrongKey = await SCCrypto.deriveSharedKey(keyPairC.privateKey, keyPairA.publicKey);
  SC_SET_ENCODING_LANG('en');
  const goodEncoded = await SCCrypto.encryptAndEncode('test', sharedKeyA, sessionId);
  try {
    await SCCrypto.decodeAndDecrypt(goodEncoded, wrongKey);
    assert(false, 'wrong key should throw');
  } catch {
    assert(true, 'wrong key throws decryption error');
  }

  // --- i18n ---
  console.log('\ni18n:');
  for (const lang of languages) {
    SCI18n.setLanguage(lang);
    assert(typeof SCI18n.t('status.active') === 'string' && SCI18n.t('status.active').length > 0, `${lang} has status.active translation`);
    assert(typeof SCI18n.t('btn.start') === 'string' && SCI18n.t('btn.start').length > 0, `${lang} has btn.start translation`);
  }
  assertEq(SCI18n.getAvailableLanguages().sort(), ['be', 'de', 'en', 'fa', 'kk', 'ru', 'uk'], 'available languages');

  // Auto-detect locale
  assertEq(SCI18n.detectFromLocale('ru-RU'), 'ru', 'detect ru-RU');
  assertEq(SCI18n.detectFromLocale('uk'), 'uk', 'detect uk');
  assertEq(SCI18n.detectFromLocale('de-DE'), 'de', 'detect de-DE');
  assertEq(SCI18n.detectFromLocale('fr-FR'), 'en', 'detect fr-FR falls back to en');
  assertEq(SCI18n.detectFromLocale(''), 'en', 'detect empty falls back to en');

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
