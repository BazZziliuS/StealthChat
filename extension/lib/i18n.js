/**
 * StealthChat — Internationalization (i18n) module.
 * Provides UI translations for all supported languages.
 */

const SCI18n = (() => {

  const translations = {
    en: {
      // Status
      'status.checking': 'Checking...',
      'status.notEncrypted': 'Not encrypted',
      'status.waiting': 'Waiting for peer...',
      'status.active': 'Encryption active',

      // Buttons
      'btn.start': 'Start Encryption',
      'btn.generating': 'Generating...',
      'btn.rotate': 'Rotate Key',
      'btn.rotating': 'Rotating...',
      'btn.rotated': 'Rotated',
      'btn.reset': 'Reset Keys',
      'btn.export': 'Export',
      'btn.import': 'Import',
      'btn.resetAll': 'Reset All',

      // Sections
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

      // Confirmations
      'confirm.reset': 'Reset encryption keys for this session?\nOld messages will not be decryptable.',
      'confirm.rotate': 'Rotate encryption key?\nBoth you and your contact must rotate at the same time.\nOld messages stay readable (last 5 keys kept).',
      'confirm.delete': 'Delete this session?',
      'confirm.resetAll': 'Delete ALL sessions and keys? This cannot be undone.\nOld messages will not be decryptable.',

      // Content script
      'content.keyReceived': 'Key received! Response copied to clipboard — paste and send it.',
      'content.keyReceivedManual': 'Key received! Copy the response from the extension popup.',
      'content.encryptError': 'Encryption error: ',
      'content.keyRequest': '🔐 Key exchange request (processed)',
      'content.keyComplete': '🔐 Key exchange complete',
      'content.decrypted': 'Decrypted successfully',
      'content.decryptFailed': 'Decryption failed',
      'tooltip.session': 'Session',
      'tooltip.cipher': 'Cipher',
      'tooltip.decrypted': 'Decrypted',
      'tooltip.error': 'Error',

      // Fingerprint states
      'fp.loading': 'loading...',
      'fp.unavailable': 'unavailable',
      'fp.error': 'error',

      // Language selector
      'lang.label': 'Language'
    },

    ru: {
      'status.checking': 'Проверка...',
      'status.notEncrypted': 'Не зашифровано',
      'status.waiting': 'Ожидание собеседника...',
      'status.active': 'Шифрование активно',

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

      'lang.label': 'Язык'
    }
  };

  const languageNames = {
    en: 'English',
    ru: 'Русский'
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

  return { setLanguage, getLanguage, getAvailableLanguages, getLanguageName, t };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCI18n;
}
