/**
 * StealthChat — Content Script.
 * Injected into every page. Scans DOM for encrypted messages,
 * handles hotkey encryption, and processes key exchanges.
 */

(() => {
  let currentSession = null;
  let currentUrl = location.href;

  // --- Initialization ---

  async function init() {
    await loadLanguageSetting();
    await refreshSession();
    setupMutationObserver();
    setupHotkeyListener();
    scanExistingContent();
  }

  async function loadLanguageSetting() {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get('settings', result => resolve(result.settings));
      });
      const lang = data?.language || 'en';
      SCI18n.setLanguage(lang);
      SC_SET_ENCODING_LANG(lang);
    } catch {
      // Default to English
    }
  }

  async function refreshSession() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSession',
        url: currentUrl
      });
      currentSession = response?.session || null;
    } catch {
      currentSession = null;
    }
  }

  // --- MutationObserver: scan new DOM nodes ---

  function setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            walkTextNodes(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function walkTextNodes(element) {
    if (element.dataset?.scChecked) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      processTextNode(node);
    }
  }

  function processTextNode(textNode) {
    const parent = textNode.parentElement;
    if (!parent || parent.dataset?.scChecked) return;
    if (parent.classList?.contains('sc-decrypted')) return;

    const text = textNode.textContent?.trim();
    if (!text || !SCEncoder.looksEncoded(text)) return;

    parent.dataset.scChecked = '1';
    handleEncodedText(text, parent);
  }

  async function handleEncodedText(text, element) {
    const packetBytes = SCCrypto.decodePacket(text);
    if (!packetBytes || !SCProtocol.isValidPacket(packetBytes)) return;

    const packet = SCProtocol.parsePacket(packetBytes);
    if (!packet) return;

    // Key exchange messages
    if (packet.type === SCProtocol.MessageType.KEY_EXCHANGE_REQUEST ||
        packet.type === SCProtocol.MessageType.KEY_EXCHANGE_RESPONSE) {
      handleKeyExchangeInDOM(text, element, packet.type);
      return;
    }

    // Encrypted text — need a matching session
    if (packet.type === SCProtocol.MessageType.ENCRYPTED_TEXT) {
      const sessionId = SCProtocol.extractSessionId(packetBytes);
      if (!sessionId) return;

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'decrypt',
          encoded: text,
          sessionId
        });

        const t = SCI18n.t;

        if (response?.text) {
          const time = new Date().toLocaleTimeString();
          element.dataset.scOriginal = text;
          element.textContent = response.text;
          element.classList.add('sc-decrypted');
          element.appendChild(createTooltip({
            status: t('content.decrypted'),
            session: sessionId,
            cipher: 'AES-256-GCM',
            time
          }));
        } else if (response?.error) {
          element.classList.add('sc-error');
          element.appendChild(createTooltip({
            status: t('content.decryptFailed'),
            error: response.error,
            session: sessionId
          }));
        }
      } catch (err) {
        console.error('[StealthChat] Decryption error:', err);
      }
    }
  }

  async function handleKeyExchangeInDOM(encodedText, element, type) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'handleKeyExchange',
        encoded: encodedText,
        url: currentUrl
      });

      if (response?.status === 'session_created') {
        await refreshSession();

        const t = SCI18n.t;

        element.dataset.scOriginal = element.textContent;
        element.textContent = type === SCProtocol.MessageType.KEY_EXCHANGE_REQUEST
          ? t('content.keyRequest')
          : t('content.keyComplete');
        element.classList.add('sc-key-exchange');

        if (response.encoded) {
          try {
            await navigator.clipboard.writeText(response.encoded);
            showNotification(t('content.keyReceived'));
            // Clear clipboard after 30 seconds
            setTimeout(() => {
              navigator.clipboard.writeText('').catch(() => {});
            }, 30000);
          } catch {
            showNotification(t('content.keyReceivedManual'));
          }
        }
      }
    } catch (err) {
      console.error('[StealthChat] Key exchange error:', err);
    }
  }

  // --- Tooltip ---

  function createTooltip(info) {
    const t = SCI18n.t;
    const tooltip = document.createElement('span');
    tooltip.className = 'sc-tooltip';

    if (info.status) {
      const isOk = !info.error;
      const statusEl = document.createElement('div');
      statusEl.className = 'sc-tooltip-status';
      statusEl.textContent = (isOk ? '✓' : '✗') + ' ' + info.status;
      tooltip.appendChild(statusEl);
    }
    if (info.session) {
      tooltip.appendChild(tooltipRow(t('tooltip.session'), info.session));
    }
    if (info.cipher) {
      tooltip.appendChild(tooltipRow(t('tooltip.cipher'), info.cipher));
    }
    if (info.time) {
      tooltip.appendChild(tooltipRow(t('tooltip.decrypted'), info.time));
    }
    if (info.error) {
      tooltip.appendChild(tooltipRow(t('tooltip.error'), info.error));
    }

    return tooltip;
  }

  function tooltipRow(label, value) {
    const row = document.createElement('div');
    row.className = 'sc-tooltip-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'sc-tooltip-label';
    labelSpan.textContent = label + ':';
    const valueSpan = document.createElement('span');
    valueSpan.className = 'sc-tooltip-value';
    valueSpan.textContent = value;
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
  }

  // --- Click to toggle original ciphertext ---

  document.addEventListener('click', (e) => {
    const el = e.target;

    const decrypted = el.closest('.sc-decrypted');
    if (!decrypted || !decrypted.dataset.scOriginal) return;

    if (decrypted.dataset.scShowingOriginal === '1') {
      const original = decrypted.dataset.scOriginal;
      const tooltip = decrypted.querySelector('.sc-tooltip');
      decrypted.textContent = decrypted.dataset.scDecryptedText;
      decrypted.classList.remove('sc-showing-original');
      decrypted.classList.add('sc-decrypted');
      decrypted.dataset.scShowingOriginal = '0';
      if (tooltip) decrypted.appendChild(tooltip);
    } else {
      decrypted.dataset.scDecryptedText = decrypted.childNodes[0]?.textContent || '';
      const tooltip = decrypted.querySelector('.sc-tooltip');
      decrypted.textContent = decrypted.dataset.scOriginal;
      decrypted.classList.add('sc-showing-original');
      decrypted.dataset.scShowingOriginal = '1';
      if (tooltip) decrypted.appendChild(tooltip);
    }
  });

  // --- Hotkey: Ctrl+Enter to encrypt ---

  function setupHotkeyListener() {
    document.addEventListener('keydown', async (e) => {
      if (e.ctrlKey && e.key === 'Enter' && currentSession) {
        e.preventDefault();
        await encryptActiveField();
      }
    });
  }

  // Store original text before encryption so Ctrl+Enter can undo
  const fieldOriginals = new WeakMap();

  async function encryptActiveField() {
    const el = document.activeElement;
    if (!el || !currentSession) return;

    let text = '';
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
      text = el.value;
    } else if (el.isContentEditable) {
      text = el.innerText;
    }

    text = text.trim();
    if (!text) return;

    // If field contains encrypted text — restore original
    if (SCEncoder.looksEncoded(text) && fieldOriginals.has(el)) {
      const original = fieldOriginals.get(el);
      fieldOriginals.delete(el);
      setFieldValue(el, original);
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'encrypt',
        text,
        sessionId: currentSession.sessionId
      });

      if (response?.encoded) {
        // Save original so next Ctrl+Enter can undo
        fieldOriginals.set(el, text);
        setFieldValue(el, response.encoded);

        if (response.rotated && response.newSessionId) {
          await refreshSession();
          showNotification(SCI18n.t('content.autoRotated') || `Key auto-rotated (#${response.rotationCounter})`);
        }
      } else if (response?.error) {
        showNotification(SCI18n.t('content.encryptError') + response.error);
      }
    } catch (err) {
      console.error('[StealthChat] Encryption error:', err);
    }
  }

  function setFieldValue(el, value) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = value;
    } else if (el.isContentEditable) {
      el.innerText = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // --- Scan existing content on page load ---

  function scanExistingContent() {
    walkTextNodes(document.body);
  }

  // --- Notification ---

  function showNotification(message) {
    const existing = document.querySelector('.sc-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'sc-notification';
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 5000);
  }

  // --- Listen for messages from popup ---

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'sessionUpdated') {
      refreshSession();
      loadLanguageSetting();
      sendResponse({ ok: true });
    }
    if (msg.action === 'rescanPage') {
      scanExistingContent();
      sendResponse({ ok: true });
    }
    if (msg.action === 'languageChanged') {
      loadLanguageSetting();
      sendResponse({ ok: true });
    }
  });

  // --- Start ---

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
