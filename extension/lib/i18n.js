/**
 * StealthChat — Internationalization (i18n) module.
 * Provides UI translations for all supported languages.
 */

const SCI18n = (() => {

  const translations = {
    en: {
      'status.checking': 'Checking...',
      'status.notEncrypted': 'Not encrypted',
      'status.waiting': 'Waiting for peer...',
      'status.active': 'Encryption active',
      'status.established': 'Session established!',

      'btn.start': 'Start Encryption',
      'btn.generating': 'Generating...',
      'btn.rotate': 'Rotate Key',
      'btn.rotating': 'Rotating...',
      'btn.rotated': 'Rotated',
      'btn.reset': 'Reset Keys',
      'btn.export': 'Export',
      'btn.import': 'Import',
      'btn.resetAll': 'Reset All',

      'section.sessions': 'Sessions',
      'session.noSession': 'No encryption session for this page.',
      'session.pending': "Waiting for peer's key...",
      'session.pendingHint': 'Paste the encoded key into the chat and send it to your contact.',
      'session.encrypted': 'Encrypted session',
      'session.none': 'No sessions yet',
      'session.fingerprint': 'Fingerprint',
      'session.fingerprintHint': 'Compare this grid with your contact over a different channel (call, in person) to verify nobody intercepted the key exchange.',
      'session.hotkey': 'Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to encrypt. Click 🔒 to view ciphertext.',
      'session.rotations': 'rotations',

      'confirm.reset': 'Reset encryption keys for this session?\nOld messages will not be decryptable.',
      'confirm.rotate': 'Rotate encryption key?\nBoth you and your contact must rotate at the same time.\nOld messages stay readable (last 5 keys kept).',
      'confirm.delete': 'Delete this session?',
      'confirm.resetAll': 'Delete ALL sessions and keys? This cannot be undone.\nOld messages will not be decryptable.',

      'content.keyReceived': 'Key received! Response copied to clipboard — paste and send it.',
      'content.keyReceivedManual': 'Key received! Copy the response from the extension popup.',
      'content.encryptError': 'Encryption error: ',
      'content.autoRotated': 'Key auto-rotated for forward secrecy',
      'content.keyRequest': '🔐 Key exchange request (processed)',
      'content.keyComplete': '🔐 Key exchange complete',
      'content.decrypted': 'Decrypted successfully',
      'content.decryptFailed': 'Decryption failed',
      'tooltip.session': 'Session',
      'tooltip.cipher': 'Cipher',
      'tooltip.decrypted': 'Decrypted',
      'tooltip.error': 'Error',

      'fp.loading': 'loading...',
      'fp.unavailable': 'unavailable',
      'fp.error': 'error',

      'lang.label': 'Language',
      'theme.toggle': 'Toggle theme',
      'clipboard.cleared': 'Clipboard cleared'
    },

    ru: {
      'status.checking': 'Проверка...',
      'status.notEncrypted': 'Не зашифровано',
      'status.waiting': 'Ожидание собеседника...',
      'status.active': 'Шифрование активно',
      'status.established': 'Сессия установлена!',

      'btn.start': 'Начать шифрование',
      'btn.generating': 'Генерация...',
      'btn.rotate': 'Сменить ключ',
      'btn.rotating': 'Смена...',
      'btn.rotated': 'Ключ сменён',
      'btn.reset': 'Сбросить ключи',
      'btn.export': 'Экспорт',
      'btn.import': 'Импорт',
      'btn.resetAll': 'Сбросить всё',

      'section.sessions': 'Сессии',
      'session.noSession': 'Нет сессии шифрования для этой страницы.',
      'session.pending': 'Ожидание ключа собеседника...',
      'session.pendingHint': 'Вставьте закодированный ключ в чат и отправьте собеседнику.',
      'session.encrypted': 'Зашифрованная сессия',
      'session.none': 'Сессий пока нет',
      'session.fingerprint': 'Отпечаток',
      'session.fingerprintHint': 'Сравните эту таблицу с собеседником по другому каналу (звонок, лично), чтобы убедиться, что ключ не был перехвачен.',
      'session.hotkey': 'Нажмите <kbd>Ctrl</kbd>+<kbd>Enter</kbd> для шифрования. Нажмите 🔒 для просмотра шифротекста.',
      'session.rotations': 'ротаций',

      'confirm.reset': 'Сбросить ключи шифрования для этой сессии?\nСтарые сообщения не будут расшифрованы.',
      'confirm.rotate': 'Сменить ключ шифрования?\nОба собеседника должны сменить ключ одновременно.\nСтарые сообщения останутся читаемыми (хранятся последние 5 ключей).',
      'confirm.delete': 'Удалить эту сессию?',
      'confirm.resetAll': 'Удалить ВСЕ сессии и ключи? Это действие необратимо.\nСтарые сообщения не будут расшифрованы.',

      'content.keyReceived': 'Ключ получен! Ответ скопирован в буфер обмена — вставьте и отправьте.',
      'content.keyReceivedManual': 'Ключ получен! Скопируйте ответ из всплывающего окна расширения.',
      'content.encryptError': 'Ошибка шифрования: ',
      'content.autoRotated': 'Ключ автоматически сменён для forward secrecy',
      'content.keyRequest': '🔐 Запрос обмена ключами (обработан)',
      'content.keyComplete': '🔐 Обмен ключами завершён',
      'content.decrypted': 'Расшифровано успешно',
      'content.decryptFailed': 'Ошибка расшифровки',
      'tooltip.session': 'Сессия',
      'tooltip.cipher': 'Шифр',
      'tooltip.decrypted': 'Расшифровано',
      'tooltip.error': 'Ошибка',

      'fp.loading': 'загрузка...',
      'fp.unavailable': 'недоступно',
      'fp.error': 'ошибка',

      'lang.label': 'Язык',
      'theme.toggle': 'Сменить тему',
      'clipboard.cleared': 'Буфер очищен'
    },

    uk: {
      'status.checking': 'Перевірка...',
      'status.notEncrypted': 'Не зашифровано',
      'status.waiting': 'Очікування співрозмовника...',
      'status.active': 'Шифрування активне',
      'status.established': 'Сесію встановлено!',

      'btn.start': 'Почати шифрування',
      'btn.generating': 'Генерація...',
      'btn.rotate': 'Змінити ключ',
      'btn.rotating': 'Зміна...',
      'btn.rotated': 'Ключ змінено',
      'btn.reset': 'Скинути ключі',
      'btn.export': 'Експорт',
      'btn.import': 'Імпорт',
      'btn.resetAll': 'Скинути все',

      'section.sessions': 'Сесії',
      'session.noSession': 'Немає сесії шифрування для цієї сторінки.',
      'session.pending': 'Очікування ключа співрозмовника...',
      'session.pendingHint': 'Вставте закодований ключ у чат і надішліть співрозмовнику.',
      'session.encrypted': 'Зашифрована сесія',
      'session.none': 'Сесій поки немає',
      'session.fingerprint': 'Відбиток',
      'session.fingerprintHint': 'Порівняйте цю таблицю зі співрозмовником через інший канал (дзвінок, особисто), щоб переконатись, що ключ не було перехоплено.',
      'session.hotkey': 'Натисніть <kbd>Ctrl</kbd>+<kbd>Enter</kbd> для шифрування. Натисніть 🔒 для перегляду шифротексту.',
      'session.rotations': 'ротацій',

      'confirm.reset': 'Скинути ключі шифрування для цієї сесії?\nСтарі повідомлення не будуть розшифровані.',
      'confirm.rotate': 'Змінити ключ шифрування?\nОбидва співрозмовники мають змінити ключ одночасно.\nСтарі повідомлення залишаться читабельними (зберігаються останні 5 ключів).',
      'confirm.delete': 'Видалити цю сесію?',
      'confirm.resetAll': 'Видалити ВСІ сесії та ключі? Це незворотна дія.\nСтарі повідомлення не будуть розшифровані.',

      'content.keyReceived': 'Ключ отримано! Відповідь скопійовано — вставте та надішліть.',
      'content.keyReceivedManual': 'Ключ отримано! Скопіюйте відповідь з вікна розширення.',
      'content.encryptError': 'Помилка шифрування: ',
      'content.autoRotated': 'Ключ автоматично змінено для forward secrecy',
      'content.keyRequest': '🔐 Запит обміну ключами (оброблено)',
      'content.keyComplete': '🔐 Обмін ключами завершено',
      'content.decrypted': 'Розшифровано успішно',
      'content.decryptFailed': 'Помилка розшифровки',
      'tooltip.session': 'Сесія',
      'tooltip.cipher': 'Шифр',
      'tooltip.decrypted': 'Розшифровано',
      'tooltip.error': 'Помилка',

      'fp.loading': 'завантаження...',
      'fp.unavailable': 'недоступно',
      'fp.error': 'помилка',

      'lang.label': 'Мова',
      'theme.toggle': 'Змінити тему',
      'clipboard.cleared': 'Буфер очищено'
    },

    de: {
      'status.checking': 'Prüfung...',
      'status.notEncrypted': 'Nicht verschlüsselt',
      'status.waiting': 'Warten auf Gegenüber...',
      'status.active': 'Verschlüsselung aktiv',
      'status.established': 'Sitzung hergestellt!',

      'btn.start': 'Verschlüsselung starten',
      'btn.generating': 'Generierung...',
      'btn.rotate': 'Schlüssel wechseln',
      'btn.rotating': 'Wechsel...',
      'btn.rotated': 'Gewechselt',
      'btn.reset': 'Schlüssel zurücksetzen',
      'btn.export': 'Export',
      'btn.import': 'Import',
      'btn.resetAll': 'Alles zurücksetzen',

      'section.sessions': 'Sitzungen',
      'session.noSession': 'Keine Verschlüsselungssitzung für diese Seite.',
      'session.pending': 'Warten auf den Schlüssel des Gegenübers...',
      'session.pendingHint': 'Fügen Sie den kodierten Schlüssel in den Chat ein und senden Sie ihn.',
      'session.encrypted': 'Verschlüsselte Sitzung',
      'session.none': 'Noch keine Sitzungen',
      'session.fingerprint': 'Fingerabdruck',
      'session.fingerprintHint': 'Vergleichen Sie dieses Raster mit Ihrem Kontakt über einen anderen Kanal (Anruf, persönlich), um sicherzustellen, dass niemand den Schlüsselaustausch abgefangen hat.',
      'session.hotkey': 'Drücken Sie <kbd>Ctrl</kbd>+<kbd>Enter</kbd> zum Verschlüsseln. Klicken Sie 🔒 für den Chiffretext.',
      'session.rotations': 'Rotationen',

      'confirm.reset': 'Schlüssel für diese Sitzung zurücksetzen?\nAlte Nachrichten werden nicht mehr entschlüsselbar.',
      'confirm.rotate': 'Schlüssel wechseln?\nBeide Teilnehmer müssen gleichzeitig wechseln.\nAlte Nachrichten bleiben lesbar (letzte 5 Schlüssel gespeichert).',
      'confirm.delete': 'Diese Sitzung löschen?',
      'confirm.resetAll': 'ALLE Sitzungen und Schlüssel löschen? Dies kann nicht rückgängig gemacht werden.',

      'content.keyReceived': 'Schlüssel empfangen! Antwort in Zwischenablage kopiert — einfügen und senden.',
      'content.keyReceivedManual': 'Schlüssel empfangen! Kopieren Sie die Antwort aus dem Erweiterungsfenster.',
      'content.encryptError': 'Verschlüsselungsfehler: ',
      'content.autoRotated': 'Schlüssel automatisch gewechselt für Forward Secrecy',
      'content.keyRequest': '🔐 Schlüsselaustausch-Anfrage (verarbeitet)',
      'content.keyComplete': '🔐 Schlüsselaustausch abgeschlossen',
      'content.decrypted': 'Erfolgreich entschlüsselt',
      'content.decryptFailed': 'Entschlüsselung fehlgeschlagen',
      'tooltip.session': 'Sitzung',
      'tooltip.cipher': 'Chiffre',
      'tooltip.decrypted': 'Entschlüsselt',
      'tooltip.error': 'Fehler',

      'fp.loading': 'Laden...',
      'fp.unavailable': 'nicht verfügbar',
      'fp.error': 'Fehler',

      'lang.label': 'Sprache',
      'theme.toggle': 'Design wechseln',
      'clipboard.cleared': 'Zwischenablage gelöscht'
    },

    be: {
      'status.checking': 'Праверка...',
      'status.notEncrypted': 'Не зашыфравана',
      'status.waiting': 'Чаканне суразмоўцы...',
      'status.active': 'Шыфраванне актыўна',
      'status.established': 'Сесію ўсталявана!',
      'btn.start': 'Пачаць шыфраванне',
      'btn.generating': 'Генерацыя...',
      'btn.rotate': 'Змяніць ключ',
      'btn.rotating': 'Змена...',
      'btn.rotated': 'Ключ зменены',
      'btn.reset': 'Скінуць ключы',
      'btn.export': 'Экспарт',
      'btn.import': 'Імпарт',
      'btn.resetAll': 'Скінуць усё',
      'section.sessions': 'Сесіі',
      'session.noSession': 'Няма сесіі шыфравання для гэтай старонкі.',
      'session.pending': 'Чаканне ключа суразмоўцы...',
      'session.pendingHint': 'Устаўце закадзіраваны ключ у чат і адпраўце суразмоўцу.',
      'session.encrypted': 'Зашыфраваная сесія',
      'session.none': 'Сесій пакуль няма',
      'session.fingerprint': 'Адбітак',
      'session.fingerprintHint': 'Параўнайце гэту табліцу з суразмоўцам праз іншы канал (званок, асабіста).',
      'session.hotkey': 'Націсніце <kbd>Ctrl</kbd>+<kbd>Enter</kbd> для шыфравання. Націсніце 🔒 для прагляду шыфратэксту.',
      'session.rotations': 'ратацый',
      'confirm.reset': 'Скінуць ключы шыфравання для гэтай сесіі?\nСтарыя паведамленні не будуць расшыфраваны.',
      'confirm.rotate': 'Змяніць ключ шыфравання?\nАбодва суразмоўцы павінны змяніць ключ адначасова.',
      'confirm.delete': 'Выдаліць гэту сесію?',
      'confirm.resetAll': 'Выдаліць УСЕ сесіі і ключы? Гэта незваротна.',
      'content.keyReceived': 'Ключ атрыманы! Адказ скапіяваны — устаўце і адпраўце.',
      'content.keyReceivedManual': 'Ключ атрыманы! Скапіюйце адказ з акна пашырэння.',
      'content.encryptError': 'Памылка шыфравання: ',
      'content.autoRotated': 'Ключ аўтаматычна зменены для forward secrecy',
      'content.keyRequest': '🔐 Запыт абмену ключамі (апрацаваны)',
      'content.keyComplete': '🔐 Абмен ключамі завершаны',
      'content.decrypted': 'Расшыфравана паспяхова',
      'content.decryptFailed': 'Памылка расшыфроўкі',
      'tooltip.session': 'Сесія',
      'tooltip.cipher': 'Шыфр',
      'tooltip.decrypted': 'Расшыфравана',
      'tooltip.error': 'Памылка',
      'fp.loading': 'загрузка...',
      'fp.unavailable': 'недаступна',
      'fp.error': 'памылка',
      'lang.label': 'Мова',
      'theme.toggle': 'Змяніць тэму',
      'clipboard.cleared': 'Буфер ачышчаны'
    },

    fa: {
      'status.checking': 'بررسی...',
      'status.notEncrypted': 'رمزنگاری نشده',
      'status.waiting': 'در انتظار طرف مقابل...',
      'status.active': 'رمزنگاری فعال',
      'status.established': 'جلسه برقرار شد!',
      'btn.start': 'شروع رمزنگاری',
      'btn.generating': 'در حال تولید...',
      'btn.rotate': 'تغییر کلید',
      'btn.rotating': 'در حال تغییر...',
      'btn.rotated': 'کلید تغییر کرد',
      'btn.reset': 'بازنشانی کلیدها',
      'btn.export': 'خروجی',
      'btn.import': 'ورودی',
      'btn.resetAll': 'بازنشانی همه',
      'section.sessions': 'جلسات',
      'session.noSession': 'جلسه رمزنگاری برای این صفحه وجود ندارد.',
      'session.pending': 'در انتظار کلید طرف مقابل...',
      'session.pendingHint': 'کلید رمزشده را در چت وارد کرده و ارسال کنید.',
      'session.encrypted': 'جلسه رمزنگاری شده',
      'session.none': 'هنوز جلسه‌ای نیست',
      'session.fingerprint': 'اثر انگشت',
      'session.fingerprintHint': 'این جدول را با مخاطب خود از طریق کانال دیگری مقایسه کنید.',
      'session.hotkey': '<kbd>Ctrl</kbd>+<kbd>Enter</kbd> را برای رمزنگاری فشار دهید. روی 🔒 کلیک کنید.',
      'session.rotations': 'چرخش',
      'confirm.reset': 'کلیدهای این جلسه بازنشانی شوند؟',
      'confirm.rotate': 'کلید رمزنگاری تغییر کند؟\nهر دو طرف باید همزمان تغییر دهند.',
      'confirm.delete': 'این جلسه حذف شود؟',
      'confirm.resetAll': 'همه جلسات و کلیدها حذف شوند؟ این عمل برگشت‌ناپذیر است.',
      'content.keyReceived': 'کلید دریافت شد! پاسخ کپی شد — بچسبانید و ارسال کنید.',
      'content.keyReceivedManual': 'کلید دریافت شد! پاسخ را از پنجره افزونه کپی کنید.',
      'content.encryptError': 'خطای رمزنگاری: ',
      'content.autoRotated': 'کلید به صورت خودکار برای امنیت پیشرو تغییر کرد',
      'content.keyRequest': '🔐 درخواست تبادل کلید (پردازش شد)',
      'content.keyComplete': '🔐 تبادل کلید کامل شد',
      'content.decrypted': 'با موفقیت رمزگشایی شد',
      'content.decryptFailed': 'خطای رمزگشایی',
      'tooltip.session': 'جلسه',
      'tooltip.cipher': 'رمز',
      'tooltip.decrypted': 'رمزگشایی شده',
      'tooltip.error': 'خطا',
      'fp.loading': 'بارگذاری...',
      'fp.unavailable': 'ناموجود',
      'fp.error': 'خطا',
      'lang.label': 'زبان',
      'theme.toggle': 'تغییر پوسته',
      'clipboard.cleared': 'کلیپ‌بورد پاک شد'
    },

    kk: {
      'status.checking': 'Тексеру...',
      'status.notEncrypted': 'Шифрланбаған',
      'status.waiting': 'Әңгімелесушіні күту...',
      'status.active': 'Шифрлау белсенді',
      'status.established': 'Сессия орнатылды!',
      'btn.start': 'Шифрлауды бастау',
      'btn.generating': 'Генерация...',
      'btn.rotate': 'Кілтті ауыстыру',
      'btn.rotating': 'Ауыстыру...',
      'btn.rotated': 'Кілт ауыстырылды',
      'btn.reset': 'Кілттерді тастау',
      'btn.export': 'Экспорт',
      'btn.import': 'Импорт',
      'btn.resetAll': 'Бәрін тастау',
      'section.sessions': 'Сессиялар',
      'session.noSession': 'Бұл бет үшін шифрлау сессиясы жоқ.',
      'session.pending': 'Әңгімелесушінің кілтін күту...',
      'session.pendingHint': 'Кодталған кілтті чатқа қойып жіберіңіз.',
      'session.encrypted': 'Шифрланған сессия',
      'session.none': 'Сессиялар әлі жоқ',
      'session.fingerprint': 'Саусақ ізі',
      'session.fingerprintHint': 'Бұл кестені әңгімелесушімен басқа арна арқылы салыстырыңыз.',
      'session.hotkey': 'Шифрлау үшін <kbd>Ctrl</kbd>+<kbd>Enter</kbd> басыңыз. Шифрмәтінді көру үшін 🔒 басыңыз.',
      'session.rotations': 'ротация',
      'confirm.reset': 'Осы сессияның кілттерін тастау керек пе?',
      'confirm.rotate': 'Шифрлау кілтін ауыстыру керек пе?\nЕкі жақ бір мезгілде ауыстыруы тиіс.',
      'confirm.delete': 'Бұл сессияны жою керек пе?',
      'confirm.resetAll': 'БАРЛЫҚ сессиялар мен кілттерді жою керек пе? Бұл қайтарылмайды.',
      'content.keyReceived': 'Кілт алынды! Жауап көшірілді — қойып жіберіңіз.',
      'content.keyReceivedManual': 'Кілт алынды! Жауапты кеңейтім терезесінен көшіріңіз.',
      'content.encryptError': 'Шифрлау қатесі: ',
      'content.autoRotated': 'Кілт forward secrecy үшін автоматты ауыстырылды',
      'content.keyRequest': '🔐 Кілт алмасу сұрауы (өңделді)',
      'content.keyComplete': '🔐 Кілт алмасу аяқталды',
      'content.decrypted': 'Сәтті шифрсызданды',
      'content.decryptFailed': 'Шифрсыздау қатесі',
      'tooltip.session': 'Сессия',
      'tooltip.cipher': 'Шифр',
      'tooltip.decrypted': 'Шифрсызданды',
      'tooltip.error': 'Қате',
      'fp.loading': 'жүктелуде...',
      'fp.unavailable': 'қолжетімсіз',
      'fp.error': 'қате',
      'lang.label': 'Тіл',
      'theme.toggle': 'Тақырыпты ауыстыру',
      'clipboard.cleared': 'Буфер тазаланды'
    }
  };

  const languageNames = {
    en: 'English',
    ru: 'Русский',
    uk: 'Українська',
    de: 'Deutsch',
    be: 'Беларуская',
    fa: 'فارسی',
    kk: 'Қазақша'
  };

  let activeLang = 'en';

  function setLanguage(lang) {
    if (translations[lang]) {
      activeLang = lang;
      return true;
    }
    return false;
  }

  function t(key) {
    return translations[activeLang]?.[key] || translations.en[key] || key;
  }

  function getLanguage() {
    return activeLang;
  }

  function getAvailableLanguages() {
    return Object.keys(translations);
  }

  function getLanguageName(code) {
    return languageNames[code] || code;
  }

  /**
   * Detect the best matching language from a browser locale string.
   * @param {string} locale - e.g. "ru-RU", "en-US", "uk", "de-DE"
   * @returns {string} Language code
   */
  function detectFromLocale(locale) {
    if (!locale) return 'en';
    const lang = locale.split('-')[0].toLowerCase();
    return translations[lang] ? lang : 'en';
  }

  return { setLanguage, getLanguage, getAvailableLanguages, getLanguageName, t, detectFromLocale };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCI18n;
}
