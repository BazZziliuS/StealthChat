/**
 * StealthChat — Word categories for steganographic encoding.
 * 8 categories × 16 words = 128 words total.
 * Each word encodes 4 bits (index 0–15 within its category).
 */

const SC_WORDLIST = {
  names: [
    'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry',
    'Irene', 'Jack', 'Karen', 'Leo', 'Mary', 'Nick', 'Olivia', 'Peter'
  ],
  adverbs: [
    'quickly', 'slowly', 'carefully', 'eagerly', 'gently', 'happily',
    'kindly', 'loudly', 'nearly', 'openly', 'politely', 'quietly',
    'rapidly', 'softly', 'warmly', 'wisely'
  ],
  verbs: [
    'brought', 'carried', 'caught', 'crossed', 'delivered', 'dropped',
    'entered', 'fetched', 'gathered', 'handed', 'joined', 'kept',
    'launched', 'moved', 'offered', 'placed'
  ],
  articles: [
    'the', 'a', 'one', 'this', 'that', 'each', 'every', 'some',
    'any', 'his', 'her', 'its', 'our', 'your', 'my', 'their'
  ],
  adjectives: [
    'bright', 'calm', 'dark', 'empty', 'fair', 'grand', 'heavy', 'keen',
    'light', 'mild', 'neat', 'old', 'plain', 'rich', 'sharp', 'tall'
  ],
  nouns: [
    'bridge', 'castle', 'clinic', 'desert', 'engine', 'forest', 'garden',
    'harbor', 'island', 'jungle', 'kingdom', 'library', 'market', 'novel',
    'ocean', 'palace'
  ],
  prepositions: [
    'about', 'above', 'across', 'after', 'against', 'along', 'among',
    'around', 'before', 'behind', 'below', 'beneath', 'beside', 'between',
    'beyond', 'through'
  ],
  timeWords: [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    'Sunday', 'January', 'March', 'April', 'June', 'July',
    'August', 'October', 'November', 'December'
  ]
};

// Category order matching the sentence template
const SC_CATEGORY_ORDER = [
  'names', 'adverbs', 'verbs', 'articles',
  'adjectives', 'nouns', 'prepositions', 'timeWords'
];

// Build reverse lookup maps: word → index (case-insensitive)
const SC_REVERSE_LOOKUP = {};
for (const category of SC_CATEGORY_ORDER) {
  SC_REVERSE_LOOKUP[category] = {};
  SC_WORDLIST[category].forEach((word, index) => {
    SC_REVERSE_LOOKUP[category][word.toLowerCase()] = index;
  });
}

// Marker word: first word of first category at index corresponding to protocol version 0x01 high nibble = 0
// Version 0x01 → high nibble = 0 → names[0] = "Alice"
const SC_MARKER_WORD = SC_WORDLIST.names[0].toLowerCase();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SC_WORDLIST, SC_CATEGORY_ORDER, SC_REVERSE_LOOKUP, SC_MARKER_WORD };
}
