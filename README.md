# StealthChat

**End-to-end encryption for any web messenger — messages look like ordinary sentences in your chosen language.**

StealthChat is a Chrome extension that encrypts your messages before sending and decrypts incoming messages automatically. Instead of gibberish ciphertext, encrypted messages appear as natural sentences in 7 languages — invisible to platforms, servers, and anyone without the extension.

---

## How It Looks

```
You type:          "Meet me at 5 near the subway"

What gets sent     "Alice bravely arranged several ancient anchor despite morning.
(English):          Quinn calmly blocked both bitter beacon during evening."

What gets sent     "Алиса твердо описал этих древний бухта вместо февраль.
(Russian):          Антон глубоко закрыл других горький каньон помимо май."

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
│  │  Text   │  (toggle undo)   │ Extension │                     │
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
  │  Compress   │  deflate-raw (built-in CompressionStream)
  │             │  only if it shrinks the data
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Encrypt    │  AES-256-GCM (8-byte auth tag)
  │             │  + random 12-byte IV
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Package    │  version + flags + session ID + IV + ciphertext
  │  (proto v2) │  compact 16-byte header
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Encode     │  bytes → sentences (7 languages)
  │  (wordlist) │  5 bits per word, 8 words per sentence
  └──────┬──────┘
         ▼
  "Alice bravely arranged several ancient anchor despite morning.
   Quinn calmly blocked both bitter beacon during evening."
```

### Sentence Encoding

Bytes are packed into a 40-bit stream, then split into 8 groups of 5 bits. Each 5-bit value (0–31) selects a word from a category of 32 words:

**Sentence template:** `Name adverb verb article adjective noun preposition time.`

7 supported languages, each with 256 words (8 categories × 32 words):

| Language | Code | Example |
|----------|------|---------|
| English | EN | Alice bravely arranged several ancient anchor despite morning. |
| Russian | RU | Алиса твердо описал этих древний бухта вместо февраль. |
| Ukrainian | UK | Оксана твердо описав цих давній якір замість лютий. |
| German | DE | Annika tapfer ordnete diese antik Anker während Februar. |
| Belarusian | BE | Янка моцна апісаў гэтых старажытны якар замест люты. |
| Persian | FA | دارا محکم نوشت اینها باستانی لنگر بجای اردیبهشت. |
| Kazakh | KK | Айгүл берік сипаттады бұлар ежелгі зәкір орнына ақпан. |

**One sentence = 8 words = 40 bits = 5 bytes of data**

Decoding auto-detects the language by checking the first word — a message encoded in Russian will be correctly decoded regardless of the receiver's language setting.

### Key Exchange (ECDH)

```
     Alice                                    Bob
       │                                        │
       │  1. Generate ECDH key pair             │
       │  2. Encode public key as sentences     │
       │                                        │
       │──── encoded sentences (14 sentences) ──►│
       │     (contains Alice's public key)      │
       │                                        │
       │                          3. Generate ECDH key pair
       │                          4. Compute shared secret
       │                          5. Encode public key
       │                                        │
       │◄── encoded sentences (14 sentences) ────│
       │    (contains Bob's public key)         │
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

1. Download: `git clone` or **Code → Download ZIP**
2. Open `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`)
3. Enable **Developer mode**
4. Click **"Load unpacked"** → select the **`extension/`** folder
5. Pin to toolbar (🧩 → 📌)

> **Note:** Both you and your contact need to install the extension.

## Usage

### Step 1 — Choose Language & Set Up Encryption

1. Click the **StealthChat** icon (🔒) in the toolbar
2. Select your preferred language (**EN / RU / UK / DE / BE / FA / KK**)
3. Click **"Start Encryption"**
4. The encoded public key is automatically copied to your clipboard (cleared after 30 seconds)
5. Paste it into the chat and send
6. Your contact's extension auto-detects the key and copies a response
7. They paste and send the response back
8. Both sides now show **"Encryption active"**

### Step 2 — Send Encrypted Messages

1. Type your message in the chat's input field as usual
2. Press **Ctrl+Enter** — your text is replaced with encoded sentences
3. Changed your mind? Press **Ctrl+Enter** again to restore the original text
4. Send the message normally (Enter, click Send, etc.)

### Step 3 — Receive Messages

Automatic — StealthChat scans the page for encoded messages and decrypts them in-place. A 🔒 icon appears next to decrypted messages. Messages are auto-detected regardless of which language they were encoded in.

### Managing Sessions

Click the StealthChat icon to see:
- **Current page status** — encrypted or not
- **Toggle** — turn encryption on/off for this page
- **Theme** — switch between dark and light themes (☀/🌙)
- **Language selector** — EN, RU, UK, DE, BE, FA, KK
- **Session selector** — switch between multiple sessions on the same page
- **Sessions list** — all active encrypted sessions
- **Export/Import** — backup and restore your keys
- **Reset All** — wipe all sessions and keys

### Verifying Your Contact (Fingerprint)

After setting up encryption, both you and your contact see a **fingerprint** — a 4x4 grid of hex pairs derived from the shared key. Compare the grid over a different channel (phone call, in person) to confirm no one intercepted the key exchange.

### Viewing Original Ciphertext

Click on any decrypted message (or the 🔒 icon) to toggle between the decrypted text and the original encoded sentences. The icon changes to 🔓 while showing ciphertext.

### Key Rotation (Forward Secrecy)

- **Automatic**: keys rotate every 50 messages for forward secrecy
- **Manual**: click **"Rotate Key"** in the popup to rotate immediately
- Both users must have compatible key states
- Last 5 old keys are kept so old messages stay readable
- The fingerprint changes after rotation — verify again with your contact

---

## Security

| Feature | Implementation |
|---------|---------------|
| Key exchange | ECDH P-256 (Web Crypto API) |
| Key derivation | HKDF-SHA256 |
| Encryption | AES-256-GCM |
| Message integrity | GCM auth tag (8 bytes / 64 bits) |
| IV/Nonce | 12 bytes, cryptographically random |
| Compression | Built-in deflate-raw (CompressionStream API) |
| Forward secrecy | Auto-rotation every 50 messages + manual HKDF-ratchet |
| Fingerprint | SHA-256 of symmetric key, first 16 bytes |
| Crypto library | Web Crypto API only — zero third-party dependencies |
| XSS protection | HTML escaping + DOM API for user data |
| Import validation | Schema validation, prototype pollution protection |
| Clipboard | Auto-cleared 30 seconds after key copy |

### What StealthChat protects against

- Platform reading your messages (E2E encrypted)
- Message tampering (AES-GCM auth tag)
- Replay attacks (unique IV per message)
- Pattern detection (messages look like normal text in 7 languages)
- Future key compromise revealing past messages (auto key rotation / PFS)

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
│   └── background.js       # Service Worker — crypto, key management, auto-rotation
├── content/
│   ├── content.js          # DOM scanning, Ctrl+Enter toggle, key exchange
│   └── content.css         # Lock icon, notification styles
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Dark/light theme (CSS variables)
│   └── popup.js            # Popup logic, i18n, theme toggle
├── lib/
│   ├── i18n.js             # UI translations (7 languages)
│   ├── wordlist.js         # Steganographic dictionaries (7 × 256 words)
│   ├── encoder.js          # 5-bit encoding: bytes ↔ sentences
│   ├── protocol.js         # Binary protocol v2 (compact)
│   └── crypto.js           # ECDH, HKDF, AES-GCM, compression
├── test-chat.html          # Two-panel test chat
└── icons/
    └── ...
```

---

## Binary Protocol v2

Every encrypted message has this structure:

```
┌─────────┬───────┬────────────┬────────────┬──────────────────────┐
│ Version │ Flags │ Session ID │     IV     │    Ciphertext        │
│ 1 byte  │1 byte │  2 bytes   │  12 bytes  │    N bytes           │
│  0x02   │       │            │            │  (includes 8B tag)   │
└─────────┴───────┴────────────┴────────────┴──────────────────────┘

Flags byte: bit 7 = compressed, bits 0-3 = type
Type: 0x01 = encrypted text
      0x02 = key exchange request
      0x03 = key exchange response
```

Compact header: 16 bytes (vs 18 in v1). 8-byte auth tag (vs 16 in v1).

---

## License

MIT
