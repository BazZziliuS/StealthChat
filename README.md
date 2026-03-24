# StealthChat

**End-to-end encryption for any web messenger — messages look like ordinary English sentences.**

StealthChat is a Chrome extension that encrypts your messages before sending and decrypts incoming messages automatically. Instead of gibberish ciphertext, encrypted messages appear as natural English sentences — invisible to platforms, servers, and anyone without the extension.

---

## How It Looks

```
You type:          "Meet me at 5 near the subway"

What gets sent:    "Alice slowly brought a neat desert along December.
                    Grace happily entered every calm ocean beyond Friday."

What your contact
with StealthChat
sees:              "Meet me at 5 near the subway"
```

No markers. No tags. No suspicious characters. Just regular English sentences.

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
                    │   Platform  │  Sees only English sentences
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
  │  Encode     │  bytes → English sentences
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

     High nibble: 1010 = 10 ──► adjectives[10] = "neat"
     Low nibble:  0011 =  3 ──► nouns[3]       = "desert"
```

**Sentence template:** `Name adverb verb article adjective noun preposition time.`

| Position | Category | 16 words | Example |
|----------|----------|----------|---------|
| 1 | Names | Alice, Bob, Carol... | Alice |
| 2 | Adverbs | quickly, slowly... | slowly |
| 3 | Verbs | brought, carried... | brought |
| 4 | Articles | the, a, one, this... | a |
| 5 | Adjectives | bright, calm, dark... | neat |
| 6 | Nouns | bridge, castle... | desert |
| 7 | Prepositions | about, above... | along |
| 8 | Time words | Monday, Tuesday... | December |

**→ One sentence = 8 words = 32 bits = 4 bytes of data**

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

Navigate to the extensions page in your browser:

| Browser | Address |
|---------|---------|
| Chrome  | `chrome://extensions/` |
| Edge    | `edge://extensions/` |
| Brave   | `brave://extensions/` |

**Step 3 — Enable Developer Mode**

```
┌─────────────────────────────────────────────────────────┐
│  Extensions                              [Developer mode ☑] │
│                                                         │
│  ┌─────────────────┐                                    │
│  │ Load unpacked  │  ← Click this button               │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

Toggle the **Developer mode** switch in the top-right corner of the page.

**Step 4 — Load the extension**

1. Click **"Load unpacked"** (appears after enabling Developer Mode)
2. In the file dialog, navigate to the downloaded repository
3. Select the **`extension/`** folder (not the root folder — specifically the `extension/` subfolder)
4. Click **"Select Folder"**

**Step 5 — Pin to toolbar**

```
┌──────────────────────────┐
│  🧩 Extensions           │
│  ┌────────────────────┐  │
│  │ 🔒 StealthChat  📌 │  ← Click the pin icon
│  └────────────────────┘  │
└──────────────────────────┘
```

1. Click the puzzle icon (🧩) in the browser toolbar
2. Find **StealthChat** in the list
3. Click the **pin icon** (📌) to keep it visible in the toolbar

**Done!** The StealthChat lock icon now appears in your toolbar.

> **Note:** Both you and your contact need to install the extension. Share this repository link with them.

## Usage

### Step 1 — Set Up Encryption with a Contact

```
  You                                         Your Contact
   │                                               │
   │  1. Click 🔒 icon → "Start Encryption"        │
   │  2. Key copied to clipboard                   │
   │                                               │
   │  3. Paste & send ──────────────────────────►  │
   │     "Carol eagerly delivered the bright       │
   │      castle across Saturday..."               │
   │                                               │
   │                          4. Extension detects key
   │                          5. Response auto-copied
   │                                               │
   │  ◄────────────────────── 6. Paste & send      │
   │     "David kindly fetched one fair             │
   │      garden behind Sunday..."                 │
   │                                               │
   │  ✅ "Encryption active"    ✅ "Encryption active"
```

1. Open any web chat (Telegram Web, WhatsApp Web, Facebook Messenger, etc.)
2. Click the **StealthChat** icon (🔒) in the toolbar
3. Click **"Start Encryption"**
4. The encoded public key is automatically copied to your clipboard
5. Paste it into the chat and send — it looks like normal English sentences
6. Your contact's extension auto-detects the key and copies a response
7. They paste and send the response back
8. Both sides now show **"Encryption active"**

### Step 2 — Send Encrypted Messages

```
  ┌────────────────────────────────────┐
  │ Chat input                         │
  │                                    │
  │ "Meet me at 5 near the subway"     │  ← Type normally
  │                                    │
  │            Press Ctrl+Enter        │
  │                  ▼                 │
  │ "Alice slowly brought a neat       │  ← Text is replaced
  │  desert along December. Grace      │
  │  happily entered every calm        │
  │  ocean beyond Friday."             │
  │                                    │
  │               [Send] ← Click send  │
  └────────────────────────────────────┘
```

1. Type your message in the chat's input field as usual
2. Press **Ctrl+Enter** — your text is replaced with encoded sentences
3. Send the message normally (Enter, click Send, etc.)

### Step 3 — Receive Messages

```
  ┌─────────────────────────────────────────┐
  │  Contact:                               │
  │  "Meet me at 5 near the subway" 🔒      │  ← Auto-decrypted
  │                                         │
  │  Without extension, they would see:     │
  │  "Alice slowly brought a neat desert    │
  │   along December..."                    │
  └─────────────────────────────────────────┘
```

Automatic — StealthChat scans the page for encoded messages and decrypts them in-place. A 🔒 icon appears next to decrypted messages.

### Managing Sessions

Click the StealthChat icon to see:
- **Current page status** — encrypted or not
- **Toggle** — turn encryption on/off for this page
- **Session selector** — switch between multiple sessions on the same page
- **Sessions list** — all active encrypted sessions
- **Export/Import** — backup and restore your keys
- **Reset All** — wipe all sessions and keys

### Verifying Your Contact (Fingerprint)

```
  ┌──────────────────────────────────┐
  │  🔒 StealthChat           v1.0  │
  │  ● Encryption active             │
  │                                  │
  │  FINGERPRINT                  ?  │
  │  ┌──────┬──────┬──────┬──────┐   │
  │  │  a3  │  b5  │  c7  │  d9  │   │
  │  ├──────┼──────┼──────┼──────┤   │
  │  │  e1  │  f2  │  0a  │  4b  │   │
  │  ├──────┼──────┼──────┼──────┤   │
  │  │  8c  │  3e  │  7f  │  1d  │   │
  │  ├──────┼──────┼──────┼──────┤   │
  │  │  2b  │  9a  │  5e  │  0c  │   │
  │  └──────┴──────┴──────┴──────┘   │
  │                                  │
  │  [Rotate Key]  [Reset Keys]      │
  └──────────────────────────────────┘
```

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
│   ├── popup.css           # Dark theme styles
│   └── popup.js            # Popup logic
├── lib/
│   ├── wordlist.js         # 8 categories × 16 words dictionary
│   ├── encoder.js          # Bytes ↔ sentences conversion
│   ├── protocol.js         # Binary packet format
│   └── crypto.js           # ECDH, HKDF, AES-GCM operations
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
