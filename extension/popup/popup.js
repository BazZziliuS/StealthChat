/**
 * StealthChat — Popup UI logic.
 */

(() => {
  // --- DOM refs ---
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const noSessionSection = document.getElementById('no-session');
  const pendingSection = document.getElementById('pending-exchange');
  const activeSection = document.getElementById('active-session');
  const sessionLabel = document.getElementById('session-label');
  const toggleSession = document.getElementById('toggle-session');
  const sessionSelector = document.getElementById('session-selector');
  const sessionSelect = document.getElementById('session-select');
  const fingerprintGrid = document.getElementById('fingerprint-grid');
  const sessionsList = document.getElementById('sessions-list');
  const btnStart = document.getElementById('btn-start');
  const btnReset = document.getElementById('btn-reset');
  const btnRotate = document.getElementById('btn-rotate');
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const btnResetAll = document.getElementById('btn-reset-all');
  const importFile = document.getElementById('import-file');
  const langSelect = document.getElementById('lang-select');
  const themeToggle = document.getElementById('theme-toggle');
  const toastArea = document.getElementById('popup-toast-area');

  let currentTab = null;
  let currentSession = null;
  let sessionsForUrl = [];

  // --- Security: HTML escape ---
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // --- Init ---

  async function init() {
    await loadSettings();
    applyTranslations();

    currentTab = await getCurrentTab();
    if (!currentTab?.url) {
      showState('none');
      return;
    }

    const urlSessions = await sendBackground({ action: 'getSessionsForUrl', url: currentTab.url });
    sessionsForUrl = urlSessions?.sessions || [];

    const result = await sendBackground({ action: 'getSession', url: currentTab.url });

    if (result?.session) {
      currentSession = result.session;
      showState('active');

      // Show toast if session was recently created (within 60 seconds)
      const created = new Date(currentSession.createdAt).getTime();
      if (Date.now() - created < 60000) {
        showToast(SCI18n.t('status.established'));
      }
    } else {
      showState('none');
    }

    await loadSessionsList();
    setupEventListeners();
  }

  // --- Settings (language + theme) ---

  async function loadSettings() {
    const data = await new Promise(resolve => {
      chrome.storage.local.get('settings', result => resolve(result.settings));
    });

    // Language: saved → browser locale → en
    const lang = data?.language || SCI18n.detectFromLocale(navigator.language);
    SCI18n.setLanguage(lang);
    SC_SET_ENCODING_LANG(lang);
    langSelect.value = lang;

    // Theme
    const theme = data?.theme || 'dark';
    applyTheme(theme);

    // Save auto-detected language if first launch
    if (!data?.language) {
      const settings = data || {};
      settings.language = lang;
      await new Promise(resolve => {
        chrome.storage.local.set({ settings }, resolve);
      });
    }
  }

  async function changeLanguage(lang) {
    SCI18n.setLanguage(lang);
    SC_SET_ENCODING_LANG(lang);

    const settings = await getSettings();
    settings.language = lang;
    await saveSettings(settings);

    await sendBackground({ action: 'setLanguage', language: lang });
    applyTranslations();

    if (currentSession) {
      showState('active');
    }
    await loadSessionsList();
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀' : '🌙';
  }

  async function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);

    const settings = await getSettings();
    settings.theme = next;
    await saveSettings(settings);
  }

  function applyTranslations() {
    const t = SCI18n.t;

    if (statusText.textContent === 'Checking...' || statusText.textContent === SCI18n.t('status.checking')) {
      statusText.textContent = t('status.checking');
    }

    btnStart.textContent = t('btn.start');
    btnRotate.textContent = t('btn.rotate');
    btnReset.textContent = t('btn.reset');
    btnExport.textContent = t('btn.export');
    btnImport.textContent = t('btn.import');
    btnResetAll.textContent = t('btn.resetAll');

    document.getElementById('no-session-hint').textContent = t('session.noSession');
    document.getElementById('pending-text').textContent = t('session.pending');
    document.getElementById('pending-hint').textContent = t('session.pendingHint');
    document.getElementById('sessions-title').textContent = t('section.sessions');
    document.getElementById('hotkey-hint').innerHTML = t('session.hotkey');

    document.getElementById('fp-label').textContent = t('session.fingerprint');
    document.getElementById('fp-hint-icon').title = t('session.fingerprintHint');

    themeToggle.title = t('theme.toggle');
  }

  // --- Toast notification ---

  function showToast(message, duration = 3000) {
    toastArea.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'popup-toast';
    toast.textContent = message;
    toastArea.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function showState(state) {
    const t = SCI18n.t;

    noSessionSection.classList.add('hidden');
    pendingSection.classList.add('hidden');
    activeSection.classList.add('hidden');

    switch (state) {
      case 'none':
        statusIndicator.className = 'indicator off';
        statusText.textContent = t('status.notEncrypted');
        noSessionSection.classList.remove('hidden');
        break;
      case 'pending':
        statusIndicator.className = 'indicator pending';
        statusText.textContent = t('status.waiting');
        pendingSection.classList.remove('hidden');
        break;
      case 'active':
        statusIndicator.className = 'indicator on';
        statusText.textContent = t('status.active');
        activeSection.classList.remove('hidden');
        if (currentSession) {
          sessionLabel.textContent = currentSession.label || t('session.encrypted');
          toggleSession.checked = currentSession.enabled;
          loadFingerprint(currentSession.sessionId);

          if (sessionsForUrl.length > 1) {
            sessionSelector.classList.remove('hidden');
            sessionSelect.innerHTML = sessionsForUrl.map(s =>
              `<option value="${esc(s.sessionId)}" ${s.sessionId === currentSession.sessionId ? 'selected' : ''}>${esc(s.label || s.sessionId)} ${s.enabled ? '' : '(off)'}</option>`
            ).join('');
          } else {
            sessionSelector.classList.add('hidden');
          }
        }
        break;
    }
  }

  // --- Event listeners ---

  function setupEventListeners() {
    btnStart.addEventListener('click', startKeyExchange);
    btnReset.addEventListener('click', resetSession);
    btnRotate.addEventListener('click', rotateKey);
    toggleSession.addEventListener('change', toggleCurrentSession);
    sessionSelect.addEventListener('change', switchSession);
    btnExport.addEventListener('click', exportSessions);
    btnImport.addEventListener('click', () => importFile.click());
    btnResetAll.addEventListener('click', resetAllKeys);
    importFile.addEventListener('change', importSessions);
    langSelect.addEventListener('change', () => changeLanguage(langSelect.value));
    themeToggle.addEventListener('click', toggleTheme);
  }

  async function startKeyExchange() {
    if (!currentTab?.url) return;
    const t = SCI18n.t;

    btnStart.disabled = true;
    btnStart.textContent = t('btn.generating');

    try {
      const response = await sendBackground({
        action: 'startKeyExchange',
        url: currentTab.url
      });

      if (response?.encoded) {
        await navigator.clipboard.writeText(response.encoded);
        showState('pending');
        btnStart.textContent = t('btn.start');
        btnStart.disabled = false;

        // Clear clipboard after 30 seconds
        scheduleClipboardClear(30000);
      }
    } catch (err) {
      console.error('[StealthChat] Key exchange error:', err);
      btnStart.textContent = SCI18n.t('btn.start');
      btnStart.disabled = false;
    }
  }

  async function resetSession() {
    if (!currentSession) return;
    if (!confirm(SCI18n.t('confirm.reset'))) return;

    await sendBackground({
      action: 'deleteSession',
      sessionId: currentSession.sessionId
    });

    currentSession = null;
    showState('none');
    await loadSessionsList();
    notifyContentScript('sessionUpdated');
  }

  async function toggleCurrentSession() {
    if (!currentSession) return;

    const enabled = toggleSession.checked;
    await sendBackground({
      action: 'toggleSession',
      sessionId: currentSession.sessionId,
      enabled
    });

    currentSession.enabled = enabled;
    notifyContentScript('sessionUpdated');
  }

  async function switchSession() {
    const selectedId = sessionSelect.value;
    const selected = sessionsForUrl.find(s => s.sessionId === selectedId);
    if (!selected) return;

    currentSession = selected;
    sessionLabel.textContent = selected.label || SCI18n.t('session.encrypted');
    toggleSession.checked = selected.enabled;
    await loadFingerprint(selected.sessionId);
    notifyContentScript('sessionUpdated');
  }

  // --- Fingerprint ---

  async function loadFingerprint(sessionId) {
    const t = SCI18n.t;
    fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:var(--text-muted)">${esc(t('fp.loading'))}</div>`;
    try {
      const result = await sendBackground({ action: 'getFingerprint', sessionId });
      if (result?.fingerprint) {
        const groups = result.fingerprint.split(' ');
        fingerprintGrid.innerHTML = groups
          .map(g => `<div class="fp-cell">${esc(g)}</div>`)
          .join('');
      } else {
        fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:var(--text-muted)">${esc(t('fp.unavailable'))}</div>`;
      }
    } catch {
      fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:var(--danger)">${esc(t('fp.error'))}</div>`;
    }
  }

  // --- Key rotation ---

  async function rotateKey() {
    if (!currentSession) return;
    if (!confirm(SCI18n.t('confirm.rotate'))) return;
    const t = SCI18n.t;

    btnRotate.disabled = true;
    btnRotate.textContent = t('btn.rotating');

    try {
      const result = await sendBackground({
        action: 'rotateKey',
        sessionId: currentSession.sessionId
      });

      if (result?.ok) {
        currentSession.sessionId = result.newSessionId;
        await loadFingerprint(result.newSessionId);
        await loadSessionsList();
        notifyContentScript('sessionUpdated');
        btnRotate.textContent = `${t('btn.rotated')} (#${result.rotationCounter})`;
        setTimeout(() => { btnRotate.textContent = t('btn.rotate'); }, 2000);
      }
    } catch (err) {
      console.error('[StealthChat] Key rotation error:', err);
    }

    btnRotate.disabled = false;
  }

  // --- Sessions list ---

  async function loadSessionsList() {
    const t = SCI18n.t;
    const response = await sendBackground({ action: 'listSessions' });
    const sessions = response?.sessions || [];

    if (sessions.length === 0) {
      sessionsList.innerHTML = `<p class="empty-state">${esc(t('session.none'))}</p>`;
      return;
    }

    sessionsList.innerHTML = sessions.map(s => `
      <div class="session-item" data-id="${esc(s.sessionId)}">
        <div class="session-item-status ${s.enabled ? 'active' : 'disabled'}"></div>
        <span class="session-item-label" title="${esc(s.urlPattern || '')}${s.rotationCounter ? ' | ' + t('session.rotations') + ': ' + s.rotationCounter : ''}">${esc(s.label || s.sessionId)}</span>
        <button class="session-item-delete" data-id="${esc(s.sessionId)}" title="Delete">&times;</button>
      </div>
    `).join('');

    sessionsList.querySelectorAll('.session-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm(t('confirm.delete'))) {
          await sendBackground({ action: 'deleteSession', sessionId: id });
          if (currentSession?.sessionId === id) {
            currentSession = null;
            showState('none');
          }
          await loadSessionsList();
          notifyContentScript('sessionUpdated');
        }
      });
    });
  }

  // --- Reset All ---

  async function resetAllKeys() {
    if (!confirm(SCI18n.t('confirm.resetAll'))) return;

    await sendBackground({ action: 'resetAll' });
    currentSession = null;
    showState('none');
    await loadSessionsList();
    notifyContentScript('sessionUpdated');
  }

  // --- Export / Import ---

  async function exportSessions() {
    const response = await sendBackground({ action: 'exportSessions' });
    if (!response?.data) return;

    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stealthchat-sessions.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importSessions(e) {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const response = await sendBackground({
      action: 'importSessions',
      data: text
    });

    if (response?.ok) {
      await loadSessionsList();
      const check = await sendBackground({ action: 'getSession', url: currentTab.url });
      if (check?.session) {
        currentSession = check.session;
        showState('active');
      }
    }

    importFile.value = '';
  }

  // --- Clipboard clearing ---

  function scheduleClipboardClear(delayMs) {
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
      } catch {
        // Popup may be closed by then
      }
    }, delayMs);
  }

  // --- Helpers ---

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function sendBackground(message) {
    return chrome.runtime.sendMessage(message);
  }

  async function notifyContentScript(action) {
    if (!currentTab?.id) return;
    try {
      await chrome.tabs.sendMessage(currentTab.id, { action });
    } catch {
      // Content script might not be injected
    }
  }

  async function getSettings() {
    return await new Promise(resolve => {
      chrome.storage.local.get('settings', result => resolve(result.settings || {}));
    });
  }

  function saveSettings(settings) {
    return new Promise(resolve => {
      chrome.storage.local.set({ settings }, resolve);
    });
  }

  // --- Start ---
  init();
})();
