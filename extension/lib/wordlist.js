/**
 * StealthChat — Multi-language word categories for steganographic encoding.
 * 8 categories × 16 words = 128 words per language.
 * Each word encodes 4 bits (index 0–15 within its category).
 *
 * IMPORTANT: Names in each language MUST be unique across all languages
 * (case-insensitive) — SC_DETECT_LANGUAGE relies on names for auto-detection.
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
  },

  uk: {
    names: [
      'Оксана', 'Тарас', 'Леся', 'Богдан', 'Дарина', 'Василь', 'Злата', 'Андрій',
      'Катерина', 'Степан', 'Мирослава', 'Ярослав', 'Соломія', 'Петро', 'Халина', 'Ростислав'
    ],
    adverbs: [
      'швидко', 'повільно', 'тихо', 'сміливо', 'ніжно', 'весело',
      'мудро', 'голосно', 'майже', 'відкрито', 'ввічливо', 'спокійно',
      'різко', 'плавно', 'тепло', 'вправно'
    ],
    verbs: [
      'приніс', 'забрав', 'зловив', 'зустрів', 'доставив', 'впустив',
      'знайшов', 'дістав', 'зібрав', 'вручив', 'відкрив', 'зберіг',
      'кинув', 'рушив', 'віддав', 'поставив'
    ],
    articles: [
      'цей', 'той', 'один', 'свій', 'такий', 'кожний', 'будь', 'якийсь',
      'мій', 'твій', 'його', 'наш', 'ваш', 'інший', 'весь', 'сам'
    ],
    adjectives: [
      'яскравий', 'тихий', 'темний', 'порожній', 'чесний', 'старий', 'важкий', 'гострий',
      'легкий', 'ясний', 'чистий', 'новий', 'простий', 'міцний', 'високий', 'славний'
    ],
    nouns: [
      'міст', 'замок', 'місто', 'ліс', 'сад', 'порт', 'острів', 'ринок',
      'палац', 'храм', 'парк', 'музей', 'театр', 'причал', 'маяк', 'дім'
    ],
    prepositions: [
      'через', 'після', 'перед', 'навколо', 'між', 'вздовж', 'серед', 'проти',
      'позаду', 'крім', 'заради', 'біля', 'поруч', 'всередині', 'повз', 'навпроти'
    ],
    timeWords: [
      'понеділок', 'вівторок', 'середа', 'четвер', 'пятниця', 'субота',
      'неділя', 'січень', 'березень', 'квітень', 'червень', 'липень',
      'серпень', 'жовтень', 'листопад', 'грудень'
    ]
  },

  de: {
    names: [
      'Annika', 'Bernd', 'Claudia', 'Dirk', 'Elke', 'Fritz', 'Gerda', 'Heinz',
      'Inge', 'Jürgen', 'Katrin', 'Lutz', 'Monika', 'Norbert', 'Petra', 'Ralf'
    ],
    adverbs: [
      'schnell', 'langsam', 'leise', 'mutig', 'sanft', 'fröhlich',
      'klug', 'laut', 'fast', 'offen', 'höflich', 'ruhig',
      'heftig', 'weich', 'warm', 'weise'
    ],
    verbs: [
      'brachte', 'trug', 'fing', 'traf', 'lieferte', 'legte',
      'fand', 'holte', 'sammelte', 'reichte', 'öffnete', 'hielt',
      'warf', 'schob', 'gab', 'stellte'
    ],
    articles: [
      'der', 'ein', 'jener', 'dieser', 'jeder', 'mancher', 'sein', 'ihr',
      'mein', 'dein', 'unser', 'euer', 'kein', 'welcher', 'solcher', 'irgendein'
    ],
    adjectives: [
      'hell', 'still', 'dunkel', 'leer', 'edel', 'schwer', 'scharf', 'leicht',
      'mild', 'klar', 'rein', 'alt', 'schlicht', 'reich', 'hoch', 'stolz'
    ],
    nouns: [
      'Brücke', 'Schloss', 'Stadt', 'Wald', 'Garten', 'Hafen', 'Insel', 'Markt',
      'Palast', 'Tempel', 'Park', 'Museum', 'Theater', 'Turm', 'Strand', 'Haus'
    ],
    prepositions: [
      'über', 'nach', 'vor', 'neben', 'gegen', 'durch', 'unter', 'hinter',
      'zwischen', 'ohne', 'trotz', 'wegen', 'statt', 'außer', 'entlang', 'gegenüber'
    ],
    timeWords: [
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
      'Sonntag', 'Januar', 'März', 'April', 'Juni', 'Juli',
      'August', 'Oktober', 'November', 'Dezember'
    ]
  },

  be: {
    names: [
      'Янка', 'Змітрок', 'Алеся', 'Кастусь', 'Наста', 'Юрась', 'Ядвіга', 'Лявон',
      'Ганна', 'Міхась', 'Светла', 'Алесь', 'Зося', 'Вітаўт', 'Паўліна', 'Рыгор'
    ],
    adverbs: [
      'хутка', 'павольна', 'ціха', 'смела', 'лагодна', 'весела',
      'мудра', 'гучна', 'амаль', 'адкрыта', 'ветліва', 'спакойна',
      'рэзка', 'плаўна', 'цёпла', 'спрытна'
    ],
    verbs: [
      'прынёс', 'забраў', 'злавіў', 'сустрэў', 'даставіў', 'упусціў',
      'знайшоў', 'дастаў', 'сабраў', 'уручыў', 'адкрыў', 'захаваў',
      'кінуў', 'рушыў', 'аддаў', 'паставіў'
    ],
    articles: [
      'гэты', 'той', 'адзін', 'свой', 'такі', 'кожны', 'любы', 'нейкі',
      'мой', 'твой', 'яго', 'наш', 'ваш', 'іншы', 'увесь', 'сам'
    ],
    adjectives: [
      'яркі', 'ціхі', 'цёмны', 'пусты', 'чэсны', 'стары', 'цяжкі', 'востры',
      'лёгкі', 'ясны', 'чысты', 'новы', 'просты', 'моцны', 'высокі', 'слаўны'
    ],
    nouns: [
      'мост', 'замак', 'горад', 'лес', 'сад', 'порт', 'востраў', 'рынак',
      'палац', 'храм', 'парк', 'музей', 'тэатр', 'прычал', 'маяк', 'дом'
    ],
    prepositions: [
      'праз', 'пасля', 'перад', 'вакол', 'паміж', 'уздоўж', 'сярод', 'супраць',
      'ззаду', 'акрамя', 'дзеля', 'каля', 'побач', 'унутры', 'міма', 'насупраць'
    ],
    timeWords: [
      'панядзелак', 'аўторак', 'серада', 'чацвер', 'пятніца', 'субота',
      'нядзеля', 'студзень', 'сакавік', 'красавік', 'чэрвень', 'ліпень',
      'жнівень', 'кастрычнік', 'лістапад', 'снежань'
    ]
  },

  fa: {
    names: [
      'دارا', 'مهسا', 'کامران', 'شیرین', 'بهرام', 'نازنین', 'فرهاد', 'پریسا',
      'آرمان', 'سارا', 'کیوان', 'لیلا', 'رامین', 'مریم', 'سیاوش', 'نسترن'
    ],
    adverbs: [
      'سریع', 'آرام', 'آهسته', 'شجاع', 'نرم', 'شاد',
      'عاقل', 'بلند', 'تقریبا', 'آشکار', 'مودب', 'ساکت',
      'تند', 'نرمک', 'گرم', 'ماهر'
    ],
    verbs: [
      'آورد', 'برد', 'گرفت', 'دید', 'رساند', 'انداخت',
      'یافت', 'رسید', 'جمعکرد', 'داد', 'بازکرد', 'نگهداشت',
      'پرتکرد', 'حرکتداد', 'بخشید', 'گذاشت'
    ],
    articles: [
      'این', 'آن', 'یک', 'خود', 'چنین', 'هر', 'هیچ', 'برخی',
      'من', 'تو', 'او', 'ما', 'شما', 'دیگر', 'همه', 'خویش'
    ],
    adjectives: [
      'روشن', 'ساکن', 'تاریک', 'خالی', 'نیک', 'بزرگ', 'سنگین', 'تیز',
      'سبک', 'ملایم', 'پاک', 'کهن', 'ساده', 'غنی', 'بلند', 'سربلند'
    ],
    nouns: [
      'پل', 'قلعه', 'شهر', 'جنگل', 'باغ', 'بندر', 'جزیره', 'بازار',
      'کاخ', 'معبد', 'پارک', 'کتابخانه', 'تالار', 'برج', 'ساحل', 'خانه'
    ],
    prepositions: [
      'درباره', 'بالای', 'ازمیان', 'پساز', 'برابر', 'درکنار', 'میان', 'پیرامون',
      'پیشاز', 'پشت', 'زیر', 'نزدیک', 'کنار', 'درون', 'ازبرابر', 'فراتر'
    ],
    timeWords: [
      'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه',
      'یکشنبه', 'فروردین', 'خرداد', 'تیر', 'مهر', 'آبان',
      'آذر', 'دی', 'بهمن', 'اسفند'
    ]
  },

  kk: {
    names: [
      'Айгүл', 'Бауыржан', 'Гүлнар', 'Дәурен', 'Еркін', 'Жансая', 'Зарина', 'Ілияс',
      'Камила', 'Ләззат', 'Мадина', 'Нұрлан', 'Орынбасар', 'Перизат', 'Рустем', 'Сәуле'
    ],
    adverbs: [
      'тез', 'баяу', 'тыныш', 'батыл', 'жұмсақ', 'қуана',
      'дана', 'қатты', 'дерлік', 'ашық', 'сыпайы', 'байсалды',
      'кенет', 'біртіндеп', 'жылы', 'шебер'
    ],
    verbs: [
      'әкелді', 'алыпкетті', 'ұстады', 'кездесті', 'жеткізді', 'түсірді',
      'тапты', 'алды', 'жинады', 'тапсырды', 'ашты', 'сақтады',
      'лақтырды', 'жылжытты', 'берді', 'қойды'
    ],
    articles: [
      'бұл', 'ол', 'бір', 'өзінің', 'осындай', 'әрбір', 'кезкелген', 'біраз',
      'менің', 'сенің', 'оның', 'біздің', 'сіздің', 'басқа', 'бүкіл', 'өзі'
    ],
    adjectives: [
      'жарық', 'тыныш', 'қараңғы', 'бос', 'адал', 'ескі', 'ауыр', 'өткір',
      'жеңіл', 'ашық', 'таза', 'жаңа', 'қарапайым', 'мықты', 'биік', 'атақты'
    ],
    nouns: [
      'көпір', 'қамал', 'қала', 'орман', 'бақ', 'порт', 'арал', 'базар',
      'сарай', 'ғибадатхана', 'саябақ', 'мұражай', 'театр', 'мұнара', 'жағажай', 'үй'
    ],
    prepositions: [
      'туралы', 'үстінде', 'арқылы', 'кейін', 'қарсы', 'бойымен', 'арасында', 'айнала',
      'алдында', 'артында', 'астында', 'жанында', 'қасында', 'ішінде', 'жанынан', 'арғыжағында'
    ],
    timeWords: [
      'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі',
      'жексенбі', 'қаңтар', 'наурыз', 'сәуір', 'маусым', 'шілде',
      'тамыз', 'қазан', 'қараша', 'желтоқсан'
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

function SC_SET_ENCODING_LANG(lang) {
  if (SC_WORDLISTS[lang]) {
    SC_ENCODING_LANG = lang;
    return true;
  }
  return false;
}

function SC_GET_ENCODING_LANG() {
  return SC_ENCODING_LANG;
}

function SC_GET_WORDLIST() {
  return SC_WORDLISTS[SC_ENCODING_LANG];
}

function SC_GET_REVERSE_LOOKUP(lang) {
  return SC_REVERSE_LOOKUPS[lang || SC_ENCODING_LANG];
}

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

const SC_MARKER_WORD = SC_WORDLISTS.en.names[0].toLowerCase();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SC_WORDLISTS, SC_CATEGORY_ORDER, SC_REVERSE_LOOKUPS, SC_MARKER_WORD,
    SC_SET_ENCODING_LANG, SC_GET_ENCODING_LANG, SC_GET_WORDLIST, SC_GET_REVERSE_LOOKUP,
    SC_DETECT_LANGUAGE
  };
}
