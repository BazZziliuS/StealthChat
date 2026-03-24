# StealthChat

**End-to-end encryption for any web messenger — messages look like ordinary sentences in your chosen language.**

StealthChat is a Chrome extension that encrypts your messages before sending and decrypts incoming messages automatically. Instead of gibberish ciphertext, encrypted messages appear as natural sentences in English, Russian, Ukrainian, or German — invisible to platforms, servers, and anyone without the extension.

---

## How It Looks

```
You type:          "Meet me at 5 near the subway"

What gets sent     "Alice slowly brought a neat desert along December.
(English):          Grace happily entered every calm ocean beyond Friday."

What gets sent     "Алиса медленно принес этот яркий мост через понедельник.
(Russian):          Жанна весело нашел каждый чистый дворец среди пятница."

What your contact
with StealthChat
sees:              "Meet me at 5 near the subway"
```

No markers. No tags. No suspicious characters. Just regular sentences.

---

## How It Works

### The Big Picture

```
┌──────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                              │
│                                                                  │
│  ┌─────────┐    Ctrl+Enter    ┌──────────┐    encoded text      │
│  │  Your   │ ──────────────►  │ StealthChat│ ──────────────►  📤│
│  │  Text   │                  │ Extension │                     │
│  └─────────┘                  └──────────┘                      │
│                                                                  │
│  ┌─────────┐    decrypted     ┌──────────┐    encoded text      │
│  │  Clear  │ ◄──────────────  │ StealthChat│ ◄──────────────  📥│
│  │  Text   │                  │ Extension │                     │
│  └─────────┘                  └──────────┘                      │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   Platform  │  Sees only natural sentences
                    │   Server    │  ✗ Cannot read your messages
                    └─────────────┘
```

### Encryption Pipeline

```
                    SENDING A MESSAGE

  "Hello World"
       │
       ▼
  ┌─────────────┐
  │  Compress   │  UTF-8 → deflate
  │  (pako)     │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Encrypt    │  AES-256-GCM
  │             │  + random 12-byte IV
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Package    │  version + type + session ID + IV + ciphertext
  │  (protocol) │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Encode     │  bytes → sentences (EN / RU / UK / DE)
  │  (wordlist) │  4 bits per word, 8 words per sentence
  └──────┬──────┘
         ▼
  "Alice slowly brought the dark clinic behind Thursday.
   Emma carefully caught a bright garden above Monday."
```

### Sentence Encoding

Each byte of encrypted data is split into two 4-bit nibbles. Each nibble selects a word from a specific category:

```
Byte: 0xA3 = 1010 0011

     High nibble: 1010 = 10 ──► adjectives[10] = "neat" (EN) / "чистый" (RU)
     Low nibble:  0011 =  3 ──► nouns[3]       = "desert" (EN) / "лес" (RU)
```

**Sentence template:** `Name adverb verb article adjective noun preposition time.`

Each language has its own 128-word dictionary (8 categories × 16 words):

| Language | Example sentence |
|----------|-----------------|
| English  | Alice slowly brought a neat desert along December. |
| Russian  | Алиса медленно принес этот яркий мост через понедельник. |
| Ukrainian| Оксана повільно приніс цей яскравий міст через понеділок. |
| German   | Annika langsam brachte der hell Brücke über Montag. |

**→ One sentence = 8 words = 32 bits = 4 bytes of data**

Decoding auto-detects the language by checking the first word — a message encoded in Russian will be correctly decoded regardless of the receiver's language setting.

### Key Exchange (ECDH)

```
     Alice                                    Bob
       │                                        │
       │  1. Generate ECDH key pair             │
       │  2. Encode public key as sentences     │
       │                                        │
       │──── "Carol eagerly delivered..." ────► │
       │     (contains Alice's public key)      │
       │                                        │
       │                          3. Generate ECDH key pair
       │                          4. Compute shared secret
       │                          5. Encode public key
       │                                        │
       │ ◄─── "David kindly fetched..." ────────│
       │      (contains Bob's public key)       │
       │                                        │
       │  6. Compute same shared secret         │
       │  7. Derive AES-256 key (HKDF)         │
       │                                        │
       │  ══════ ENCRYPTED CHANNEL ══════       │
       │  Both sides have the same AES key      │
       │  Messages are now encrypted            │
```

---

## Installation

### Chrome / Edge / Brave (any Chromium browser)

**Step 1 — Download the extension**

```bash
git clone https://github.com/user/StealthChat.git
```

Or click **Code → Download ZIP** on GitHub and unzip anywhere on your computer.

**Step 2 — Open the extensions page**

| Browser | Address |
|---------|---------|
| Chrome  | `chrome://extensions/` |
| Edge    | `edge://extensions/` |
| Brave   | `brave://extensions/` |

**Step 3 — Enable Developer Mode**

Toggle the **Developer mode** switch in the top-right corner of the page.

**Step 4 — Load the extension**

1. Click **"Load unpacked"**
2. Navigate to the downloaded repository
3. Select the **`extension/`** folder (not the root folder)
4. Click **"Select Folder"**

**Step 5 — Pin to toolbar**

1. Click the puzzle icon (🧩) in the browser toolbar
2. Find **StealthChat** in the list
3. Click the **pin icon** (📌) to keep it visible

> **Note:** Both you and your contact need to install the extension.

## Usage

### Step 1 — Choose Language & Set Up Encryption

1. Click the **StealthChat** icon (🔒) in the toolbar
2. Select your preferred language (**EN / RU / UK / DE**) — this determines what language the encoded sentences will be in
3. Click **"Start Encryption"**
4. The encoded public key is automatically copied to your clipboard (cleared after 30 seconds)
5. Paste it into the chat and send
6. Your contact's extension auto-detects the key and copies a response
7. They paste and send the response back
8. Both sides now show **"Encryption active"**

### Step 2 — Send Encrypted Messages

1. Type your message in the chat's input field as usual
2. Press **Ctrl+Enter** — your text is replaced with encoded sentences
3. Send the message normally (Enter, click Send, etc.)

### Step 3 — Receive Messages

Automatic — StealthChat scans the page for encoded messages and decrypts them in-place. A 🔒 icon appears next to decrypted messages. Messages are auto-detected regardless of which language they were encoded in.

### Managing Sessions

Click the StealthChat icon to see:
- **Current page status** — encrypted or not
- **Toggle** — turn encryption on/off for this page
- **Theme** — switch between dark and light themes (☀/🌙)
- **Language selector** — EN, RU, UK, DE
- **Session selector** — switch between multiple sessions on the same page
- **Sessions list** — all active encrypted sessions
- **Export/Import** — backup and restore your keys
- **Reset All** — wipe all sessions and keys

### Verifying Your Contact (Fingerprint)

After setting up encryption, both you and your contact see a **fingerprint** — a 4x4 grid of hex pairs derived from the shared key. Compare the grid over a different channel (phone call, in person) to confirm no one intercepted the key exchange.

### Viewing Original Ciphertext

Click on any decrypted message (or the 🔒 icon) to toggle between the decrypted text and the original encoded sentences. The icon changes to 🔓 while showing ciphertext. Click again to switch back.

### Key Rotation (Forward Secrecy)

Click **"Rotate Key"** in the popup to derive a new encryption key from the current one. This provides forward secrecy — if a future key is compromised, past messages remain safe.

- Both users must rotate at the same time
- Last 5 old keys are kept so old messages stay readable
- The fingerprint changes after rotation — verify again with your contact

---

## Security

| Feature | Implementation |
|---------|---------------|
| Key exchange | ECDH P-256 (Web Crypto API) |
| Key derivation | HKDF-SHA256 |
| Encryption | AES-256-GCM |
| Message integrity | GCM auth tag (16 bytes) |
| IV/Nonce | 12 bytes, cryptographically random |
| Forward secrecy | HKDF-ratchet key rotation (manual) |
| Fingerprint | SHA-256 of symmetric key, first 16 bytes |
| Crypto library | Web Crypto API only — no third-party crypto |
| XSS protection | HTML escaping + DOM API for user data |
| Import validation | Schema validation, prototype pollution protection |
| Clipboard | Auto-cleared 30 seconds after key copy |

### What StealthChat protects against

- Platform reading your messages (E2E encrypted)
- Message tampering (AES-GCM auth tag)
- Replay attacks (unique IV per message)
- Pattern detection (messages look like normal text)
- Future key compromise revealing past messages (key rotation / PFS)

### What StealthChat does NOT protect against

- Compromised device (if they have access to your browser, they have your keys)
- MITM during key exchange (verify fingerprints out-of-band)
- Metadata (platform still sees who talks to whom and when)

---

## Architecture

```
extension/
├── manifest.json           # Chrome Extension Manifest V3
├── background/
│   └── background.js       # Service Worker — crypto, key management
├── content/
│   ├── content.js          # Injected into pages — DOM scanning, hotkey
│   └── content.css         # Lock icon, notification styles
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Dark/light theme styles (CSS variables)
│   └── popup.js            # Popup logic
├── lib/
│   ├── i18n.js             # Translations (EN, RU, UK, DE)
│   ├── wordlist.js         # Multi-language dictionaries (4 × 128 words)
│   ├── encoder.js          # Bytes ↔ sentences (auto-detect language on decode)
│   ├── protocol.js         # Binary packet format
│   └── crypto.js           # ECDH, HKDF, AES-GCM operations
├── test-chat.html          # Two-panel test chat for local testing
└── icons/
    └── ...
```

---

## Binary Protocol

Every message has this structure:

```
┌─────────┬──────┬────────────┬────────────┬──────────────────────┐
│ Version │ Type │ Session ID │     IV     │    Ciphertext        │
│ 1 byte  │1 byte│  4 bytes   │  12 bytes  │    N bytes           │
│  0x01   │      │            │            │  (includes auth tag) │
└─────────┴──────┴────────────┴────────────┴──────────────────────┘

Type: 0x01 = encrypted text
      0x02 = key exchange request
      0x03 = key exchange response
```

---

## License

MIT
