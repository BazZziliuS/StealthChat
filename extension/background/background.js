/**
 * StealthChat — Background Service Worker.
 * Handles crypto operations, key management, and session storage.
 */

importScripts('/lib/i18n.js', '/lib/wordlist.js', '/lib/encoder.js', '/lib/protocol.js', '/lib/crypto.js');

// Load language setting on startup
(async () => {
  const data = await loadData('settings');
  const lang = data?.language || 'en';
  SC_SET_ENCODING_LANG(lang);
})();

// --- Message handler ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('[StealthChat] Background error:', err);
    sendResponse({ error: err.message });
  });
  return true; // Keep channel open for async response
});

async function handleMessage(msg, sender) {
  switch (msg.action) {
    case 'encrypt':
      return handleEncrypt(msg);
    case 'decrypt':
      return handleDecrypt(msg);
    case 'startKeyExchange':
      return handleStartKeyExchange(msg);
    case 'handleKeyExchange':
      return handleKeyExchangeMessage(msg);
    case 'getSession':
      return handleGetSession(msg);
    case 'listSessions':
      return handleListSessions();
    case 'toggleSession':
      return handleToggleSession(msg);
    case 'deleteSession':
      return handleDeleteSession(msg);
    case 'exportSessions':
      return handleExportSessions();
    case 'importSessions':
      return handleImportSessions(msg);
    case 'resetAll':
      return handleResetAll();
    case 'getFingerprint':
      return handleGetFingerprint(msg);
    case 'getSessionsForUrl':
      return handleGetSessionsForUrl(msg);
    case 'rotateKey':
      return handleRotateKey(msg);
    case 'setLanguage':
      return handleSetLanguage(msg);
    default:
      return { error: 'Unknown action: ' + msg.action };
  }
}

// --- Language ---

async function handleSetLanguage({ language }) {
  if (SC_SET_ENCODING_LANG(language)) {
    const settings = (await loadData('settings')) || {};
    settings.language = language;
    await saveData('settings', settings);
    return { ok: true };
  }
  return { error: 'Unsupported language: ' + language };
}

// --- Encryption / Decryption ---

const AUTO_ROTATE_INTERVAL = 50; // Rotate key every N messages

async function handleEncrypt({ text, sessionId }) {
  const sessions = await loadData('sessions') || {};
  const session = sessions[sessionId];
  if (!session) return { error: 'Session not found' };

  const aesKey = await SCCrypto.importAESKey(session.symmetricKey);
  const encoded = await SCCrypto.encryptAndEncode(text, aesKey, sessionId);

  // Increment message counter
  session.messageCount = (session.messageCount || 0) + 1;
  await saveData('sessions', sessions);

  // Auto-rotate if threshold reached
  if (session.messageCount >= AUTO_ROTATE_INTERVAL) {
    const rotateResult = await handleRotateKey({ sessionId });
    if (rotateResult?.ok) {
      return { encoded, rotated: true, newSessionId: rotateResult.newSessionId, rotationCounter: rotateResult.rotationCounter };
    }
  }

  return { encoded };
}

async function handleDecrypt({ encoded, sessionId }) {
  // Try current session by session ID
  let session = await getSession(sessionId);

  // If not found by ID, search all sessions (handles rotated keys)
  if (!session) {
    const sessions = await loadData('sessions') || {};
    for (const s of Object.values(sessions)) {
      // Check previous keys from rotation history
      if (s.previousKeys) {
        const match = s.previousKeys.find(pk => pk.sessionId === sessionId);
        if (match) {
          // Decrypt with old key
          try {
            const oldKey = await SCCrypto.importAESKey(match.symmetricKey);
            const text = await SCCrypto.decodeAndDecrypt(encoded, oldKey);
            return { text };
          } catch { /* try next */ }
        }
      }
    }
    return { error: 'Session not found' };
  }

  const aesKey = await SCCrypto.importAESKey(session.symmetricKey);
  try {
    const text = await SCCrypto.decodeAndDecrypt(encoded, aesKey);
    return { text };
  } catch (err) {
    return { error: 'Decryption failed: ' + err.message };
  }
}

// --- Key Exchange ---

async function handleStartKeyExchange({ url }) {
  const keyPair = await SCCrypto.generateKeyPair();
  const publicKeyRaw = await SCCrypto.exportPublicKeyRaw(keyPair.publicKey);
  const keyPairJWK = await SCCrypto.exportKeyPairJWK(keyPair);

  // Store pending key exchange
  const pending = await loadData('pendingKeyExchanges') || {};
  pending[url] = {
    myKeyPair: keyPairJWK,
    startedAt: new Date().toISOString()
  };
  await saveData('pendingKeyExchanges', pending);

  // Build key exchange packet and encode to sentences
  const encoded = SCCrypto.encodeKeyExchange(publicKeyRaw, false);

  return { encoded };
}

async function handleKeyExchangeMessage({ encoded, url }) {
  const packetBytes = SCCrypto.decodePacket(encoded);
  if (!packetBytes) return { error: 'Failed to decode' };

  const packet = SCProtocol.parsePacket(packetBytes);
  if (!packet) return { error: 'Invalid packet' };

  if (packet.type === SCProtocol.MessageType.KEY_EXCHANGE_REQUEST) {
    return handleIncomingKeyRequest(packet, url);
  } else if (packet.type === SCProtocol.MessageType.KEY_EXCHANGE_RESPONSE) {
    return handleIncomingKeyResponse(packet, url);
  }

  return { error: 'Not a key exchange message' };
}

async function handleIncomingKeyRequest(packet, url) {
  // Generate our key pair
  const keyPair = await SCCrypto.generateKeyPair();

  // Import peer's public key
  const peerPublicKey = await SCCrypto.importPublicKeyRaw(packet.publicKeyRaw);

  // Derive shared key
  const aesKey = await SCCrypto.deriveSharedKey(keyPair.privateKey, peerPublicKey);
  const sessionId = await SCCrypto.computeSessionId(aesKey);
  const symmetricKey = await SCCrypto.exportAESKey(aesKey);

  // Store session
  const peerPublicKeyJWK = await crypto.subtle.exportKey('jwk', peerPublicKey);
  await createSession(sessionId, {
    label: new URL(url).hostname,
    urlPattern: url,
    symmetricKey,
    peerPublicKey: peerPublicKeyJWK
  });

  // Build response packet
  const publicKeyRaw = await SCCrypto.exportPublicKeyRaw(keyPair.publicKey);
  const encodedResponse = SCCrypto.encodeKeyExchange(publicKeyRaw, true);

  return { encoded: encodedResponse, sessionId, status: 'session_created' };
}

async function handleIncomingKeyResponse(packet, url) {
  // Find pending exchange for this URL
  const pending = await loadData('pendingKeyExchanges') || {};
  const exchange = pending[url];
  if (!exchange) return { error: 'No pending key exchange for this URL' };

  // Import our stored key pair
  const keyPair = await SCCrypto.importKeyPairJWK(exchange.myKeyPair);

  // Import peer's public key
  const peerPublicKey = await SCCrypto.importPublicKeyRaw(packet.publicKeyRaw);

  // Derive shared key
  const aesKey = await SCCrypto.deriveSharedKey(keyPair.privateKey, peerPublicKey);
  const sessionId = await SCCrypto.computeSessionId(aesKey);
  const symmetricKey = await SCCrypto.exportAESKey(aesKey);

  // Store session
  const peerPublicKeyJWK = await crypto.subtle.exportKey('jwk', peerPublicKey);
  await createSession(sessionId, {
    label: new URL(url).hostname,
    urlPattern: url,
    symmetricKey,
    peerPublicKey: peerPublicKeyJWK
  });

  // Clean up pending exchange
  delete pending[url];
  await saveData('pendingKeyExchanges', pending);

  return { sessionId, status: 'session_created' };
}

// --- Fingerprint ---

async function handleGetFingerprint({ sessionId }) {
  const session = await getSession(sessionId);
  if (!session) return { error: 'Session not found' };

  const aesKey = await SCCrypto.importAESKey(session.symmetricKey);
  const rawKey = await crypto.subtle.exportKey('raw', aesKey);
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  const bytes = new Uint8Array(hash);
  // Format as 8 groups of 4 hex chars: "a3b5 c7d9 e1f2 ..."
  const hex = Array.from(bytes.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const fingerprint = hex.match(/.{4}/g).join(' ');
  return { fingerprint };
}

// --- Multiple sessions per URL ---

async function handleGetSessionsForUrl({ url }) {
  const sessions = await loadData('sessions') || {};
  const matches = [];
  for (const [id, session] of Object.entries(sessions)) {
    if (urlMatchesPattern(url, session.urlPattern)) {
      matches.push({ ...session, sessionId: id });
    }
  }
  return { sessions: matches };
}

// --- Key rotation (PFS ratchet) ---

async function handleRotateKey({ sessionId }) {
  const sessions = await loadData('sessions') || {};
  const session = sessions[sessionId];
  if (!session) return { error: 'Session not found' };

  // Derive new key from current key using HKDF with rotation counter
  const counter = (session.rotationCounter || 0) + 1;
  const currentKey = await SCCrypto.importAESKey(session.symmetricKey);
  const rawKey = await crypto.subtle.exportKey('raw', currentKey);

  // HKDF: current key + counter → new key
  const hkdfKey = await crypto.subtle.importKey('raw', rawKey, 'HKDF', false, ['deriveKey']);
  const info = new TextEncoder().encode('StealthChat-rotate-' + counter);
  const newAesKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const newSymmetricKey = await SCCrypto.exportAESKey(newAesKey);
  const newSessionId = await SCCrypto.computeSessionId(newAesKey);

  // Store old key for decrypting old messages
  if (!session.previousKeys) session.previousKeys = [];
  session.previousKeys.push({
    symmetricKey: session.symmetricKey,
    sessionId: sessionId,
    rotatedAt: new Date().toISOString()
  });
  // Keep only last 5 old keys
  if (session.previousKeys.length > 5) {
    session.previousKeys = session.previousKeys.slice(-5);
  }

  // Update session with new key, reset message counter
  const updatedSession = {
    ...session,
    symmetricKey: newSymmetricKey,
    rotationCounter: counter,
    messageCount: 0,
    lastRotatedAt: new Date().toISOString()
  };

  delete sessions[sessionId];
  sessions[newSessionId] = updatedSession;
  await saveData('sessions', sessions);

  return { ok: true, newSessionId, rotationCounter: counter };
}

// --- Reset all ---

async function handleResetAll() {
  await new Promise(resolve => {
    chrome.storage.local.clear(resolve);
  });
  return { ok: true };
}

// --- Session management ---

async function handleGetSession({ url }) {
  const sessions = await loadData('sessions') || {};
  // Return the first enabled session matching this URL
  for (const [id, session] of Object.entries(sessions)) {
    if (session.enabled && urlMatchesPattern(url, session.urlPattern)) {
      return { session: { ...session, sessionId: id } };
    }
  }
  // Fallback: return first disabled match so popup can show it
  for (const [id, session] of Object.entries(sessions)) {
    if (urlMatchesPattern(url, session.urlPattern)) {
      return { session: { ...session, sessionId: id } };
    }
  }
  return { session: null };
}

async function handleListSessions() {
  const sessions = await loadData('sessions') || {};
  return { sessions: Object.entries(sessions).map(([id, s]) => ({ ...s, sessionId: id })) };
}

async function handleToggleSession({ sessionId, enabled }) {
  const sessions = await loadData('sessions') || {};
  if (sessions[sessionId]) {
    sessions[sessionId].enabled = enabled;
    await saveData('sessions', sessions);
    return { ok: true };
  }
  return { error: 'Session not found' };
}

async function handleDeleteSession({ sessionId }) {
  const sessions = await loadData('sessions') || {};
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    await saveData('sessions', sessions);
    return { ok: true };
  }
  return { error: 'Session not found' };
}

async function handleExportSessions() {
  const sessions = await loadData('sessions') || {};
  return { data: JSON.stringify(sessions) };
}

async function handleImportSessions({ data }) {
  try {
    const imported = JSON.parse(data);
    if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
      return { error: 'Invalid format' };
    }

    // Validate and sanitize each session
    const sanitized = {};
    for (const [id, session] of Object.entries(imported)) {
      // Skip prototype pollution keys
      if (id === '__proto__' || id === 'constructor' || id === 'prototype') continue;
      // Session ID must be hex string
      if (typeof id !== 'string' || !/^[a-f0-9]+$/.test(id)) continue;
      if (typeof session !== 'object' || session === null) continue;
      // Validate required fields
      if (typeof session.symmetricKey !== 'string') continue;
      if (typeof session.urlPattern !== 'string') continue;

      sanitized[id] = {
        label: typeof session.label === 'string' ? session.label.slice(0, 256) : '',
        urlPattern: session.urlPattern,
        symmetricKey: session.symmetricKey,
        peerPublicKey: session.peerPublicKey || null,
        enabled: session.enabled !== false,
        createdAt: typeof session.createdAt === 'string' ? session.createdAt : new Date().toISOString(),
        rotationCounter: typeof session.rotationCounter === 'number' ? session.rotationCounter : 0,
        previousKeys: Array.isArray(session.previousKeys) ? session.previousKeys.slice(0, 5) : []
      };
    }

    if (Object.keys(sanitized).length === 0) {
      return { error: 'No valid sessions found' };
    }

    const sessions = await loadData('sessions') || {};
    Object.assign(sessions, sanitized);
    await saveData('sessions', sessions);
    return { ok: true, count: Object.keys(sanitized).length };
  } catch (e) {
    return { error: 'Invalid JSON' };
  }
}

// --- Storage helpers ---

async function getSession(sessionId) {
  const sessions = await loadData('sessions') || {};
  return sessions[sessionId] || null;
}

async function createSession(sessionId, data) {
  const sessions = await loadData('sessions') || {};
  sessions[sessionId] = {
    ...data,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  await saveData('sessions', sessions);
}

function loadData(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

function saveData(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

// --- URL matching ---

function urlMatchesPattern(url, pattern) {
  if (!pattern) return false;
  // Convert wildcard pattern to regex
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try {
    return new RegExp('^' + escaped + '$').test(url);
  } catch {
    return url.startsWith(pattern.replace(/\*.*$/, ''));
  }
}
