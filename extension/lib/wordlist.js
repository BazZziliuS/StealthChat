/**
 * StealthChat — Multi-language word categories for steganographic encoding.
 * 8 categories × 16 words = 128 words per language.
 * Each word encodes 4 bits (index 0–15 within its category).
 */

const SC_WORDLISTS = {
  en: {
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
  },

  ru: {
    names: [
      'Алиса', 'Борис', 'Вера', 'Глеб', 'Дарья', 'Егор', 'Жанна', 'Захар',
      'Ирина', 'Кирилл', 'Лариса', 'Максим', 'Нина', 'Олег', 'Полина', 'Руслан'
    ],
    adverbs: [
      'быстро', 'медленно', 'тихо', 'смело', 'нежно', 'весело',
      'мудро', 'громко', 'почти', 'открыто', 'вежливо', 'спокойно',
      'резко', 'плавно', 'тепло', 'ловко'
    ],
    verbs: [
      'принес', 'унес', 'поймал', 'встретил', 'доставил', 'уронил',
      'нашел', 'достал', 'собрал', 'вручил', 'открыл', 'хранил',
      'бросил', 'двинул', 'отдал', 'поставил'
    ],
    articles: [
      'этот', 'тот', 'один', 'свой', 'такой', 'каждый', 'любой', 'некий',
      'мой', 'твой', 'его', 'наш', 'ваш', 'иной', 'весь', 'сам'
    ],
    adjectives: [
      'яркий', 'тихий', 'темный', 'пустой', 'честный', 'старый', 'тяжелый', 'острый',
      'легкий', 'ясный', 'чистый', 'новый', 'простой', 'крепкий', 'высокий', 'славный'
    ],
    nouns: [
      'мост', 'замок', 'город', 'лес', 'сад', 'порт', 'остров', 'рынок',
      'дворец', 'храм', 'парк', 'музей', 'театр', 'причал', 'маяк', 'дом'
    ],
    prepositions: [
      'через', 'после', 'перед', 'вокруг', 'между', 'вдоль', 'среди', 'против',
      'позади', 'кроме', 'ради', 'возле', 'около', 'внутри', 'мимо', 'напротив'
    ],
    timeWords: [
      'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота',
      'воскресенье', 'январь', 'март', 'апрель', 'июнь', 'июль',
      'август', 'октябрь', 'ноябрь', 'декабрь'
    ]
  }
};

// Category order matching the sentence template
const SC_CATEGORY_ORDER = [
  'names', 'adverbs', 'verbs', 'articles',
  'adjectives', 'nouns', 'prepositions', 'timeWords'
];

// Build reverse lookup maps for ALL languages: word → index (case-insensitive)
const SC_REVERSE_LOOKUPS = {};
for (const [lang, wordlist] of Object.entries(SC_WORDLISTS)) {
  SC_REVERSE_LOOKUPS[lang] = {};
  for (const category of SC_CATEGORY_ORDER) {
    SC_REVERSE_LOOKUPS[lang][category] = {};
    wordlist[category].forEach((word, index) => {
      SC_REVERSE_LOOKUPS[lang][category][word.toLowerCase()] = index;
    });
  }
}

// Active encoding language (default: en)
let SC_ENCODING_LANG = 'en';

/**
 * Set the active language for encoding outgoing messages.
 * @param {string} lang - Language code ('en', 'ru', etc.)
 * @returns {boolean} true if language is supported
 */
function SC_SET_ENCODING_LANG(lang) {
  if (SC_WORDLISTS[lang]) {
    SC_ENCODING_LANG = lang;
    return true;
  }
  return false;
}

/**
 * Get the current encoding language.
 * @returns {string}
 */
function SC_GET_ENCODING_LANG() {
  return SC_ENCODING_LANG;
}

/**
 * Get the wordlist for the active encoding language.
 * @returns {object}
 */
function SC_GET_WORDLIST() {
  return SC_WORDLISTS[SC_ENCODING_LANG];
}

/**
 * Get the reverse lookup for a specific language.
 * @param {string} lang
 * @returns {object}
 */
function SC_GET_REVERSE_LOOKUP(lang) {
  return SC_REVERSE_LOOKUPS[lang || SC_ENCODING_LANG];
}

/**
 * Detect which language an encoded text uses by checking the first word.
 * @param {string} text - Encoded text
 * @returns {string|null} Language code or null if not recognized
 */
function SC_DETECT_LANGUAGE(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const firstWord = trimmed.split(/[\s.]+/)[0];
  if (!firstWord) return null;

  const lower = firstWord.toLowerCase();
  for (const [lang, lookups] of Object.entries(SC_REVERSE_LOOKUPS)) {
    if (lookups.names[lower] !== undefined) {
      return lang;
    }
  }
  return null;
}

// Backward compatibility: keep SC_MARKER_WORD for English
const SC_MARKER_WORD = SC_WORDLISTS.en.names[0].toLowerCase();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SC_WORDLISTS, SC_CATEGORY_ORDER, SC_REVERSE_LOOKUPS, SC_MARKER_WORD,
    SC_SET_ENCODING_LANG, SC_GET_ENCODING_LANG, SC_GET_WORDLIST, SC_GET_REVERSE_LOOKUP,
    SC_DETECT_LANGUAGE
  };
}
