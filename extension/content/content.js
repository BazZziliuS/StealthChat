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
    await refreshSession();
    setupMutationObserver();
    setupHotkeyListener();
    scanExistingContent();
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
    // Try to decode to check packet type (strip 2-byte length prefix)
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

        if (response?.text) {
          const time = new Date().toLocaleTimeString();
          element.dataset.scOriginal = text;
          element.textContent = response.text;
          element.classList.add('sc-decrypted');
          element.appendChild(createTooltip({
            status: 'Decrypted successfully',
            session: sessionId,
            cipher: 'AES-256-GCM',
            time
          }));
        } else if (response?.error) {
          element.classList.add('sc-error');
          element.appendChild(createTooltip({
            status: 'Decryption failed',
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

        // Hide the key exchange message
        element.dataset.scOriginal = element.textContent;
        element.textContent = type === SCProtocol.MessageType.KEY_EXCHANGE_REQUEST
          ? '🔐 Key exchange request (processed)'
          : '🔐 Key exchange complete';
        element.classList.add('sc-key-exchange');

        // If we received a request, we need to send our response
        if (response.encoded) {
          // Auto-copy response to clipboard
          try {
            await navigator.clipboard.writeText(response.encoded);
            showNotification('Key received! Response copied to clipboard — paste and send it.');
          } catch {
            showNotification('Key received! Copy the response from the extension popup.');
          }
        }
      }
    } catch (err) {
      console.error('[StealthChat] Key exchange error:', err);
    }
  }

  // --- Tooltip ---

  function createTooltip(info) {
    const tooltip = document.createElement('span');
    tooltip.className = 'sc-tooltip';

    const rows = [];

    if (info.status) {
      const isOk = !info.error;
      rows.push(`<div class="sc-tooltip-status">${isOk ? '✓' : '✗'} ${info.status}</div>`);
    }
    if (info.session) {
      rows.push(tooltipRow('Session', info.session));
    }
    if (info.cipher) {
      rows.push(tooltipRow('Cipher', info.cipher));
    }
    if (info.time) {
      rows.push(tooltipRow('Decrypted', info.time));
    }
    if (info.error) {
      rows.push(tooltipRow('Error', info.error));
    }

    tooltip.innerHTML = rows.join('');
    return tooltip;
  }

  function tooltipRow(label, value) {
    return `<div class="sc-tooltip-row"><span class="sc-tooltip-label">${label}:</span><span class="sc-tooltip-value">${value}</span></div>`;
  }

  // --- Click to toggle original ciphertext ---

  document.addEventListener('click', (e) => {
    const el = e.target;

    // Click on a decrypted message element (or near the lock icon area)
    const decrypted = el.closest('.sc-decrypted');
    if (!decrypted || !decrypted.dataset.scOriginal) return;

    if (decrypted.dataset.scShowingOriginal === '1') {
      // Restore decrypted text
      const original = decrypted.dataset.scOriginal;
      const tooltip = decrypted.querySelector('.sc-tooltip');
      decrypted.textContent = decrypted.dataset.scDecryptedText;
      decrypted.classList.remove('sc-showing-original');
      decrypted.classList.add('sc-decrypted');
      decrypted.dataset.scShowingOriginal = '0';
      if (tooltip) decrypted.appendChild(tooltip);
    } else {
      // Show original ciphertext
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

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'encrypt',
        text,
        sessionId: currentSession.sessionId
      });

      if (response?.encoded) {
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          el.value = response.encoded;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (el.isContentEditable) {
          el.innerText = response.encoded;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (response?.error) {
        showNotification('Encryption error: ' + response.error);
      }
    } catch (err) {
      console.error('[StealthChat] Encryption error:', err);
    }
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
      sendResponse({ ok: true });
    }
    if (msg.action === 'rescanPage') {
      scanExistingContent();
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
