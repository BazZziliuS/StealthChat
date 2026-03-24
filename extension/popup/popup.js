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
    // Load language setting first
    await loadLanguageSetting();
    applyTranslations();

    currentTab = await getCurrentTab();
    if (!currentTab?.url) {
      showState('none');
      return;
    }

    // Get all sessions matching this URL
    const urlSessions = await sendBackground({ action: 'getSessionsForUrl', url: currentTab.url });
    sessionsForUrl = urlSessions?.sessions || [];

    // Get active session
    const result = await sendBackground({ action: 'getSession', url: currentTab.url });

    if (result?.session) {
      currentSession = result.session;
      showState('active');
    } else {
      showState('none');
    }

    await loadSessionsList();
    setupEventListeners();
  }

  // --- Language ---

  async function loadLanguageSetting() {
    const data = await new Promise(resolve => {
      chrome.storage.local.get('settings', result => resolve(result.settings));
    });
    const lang = data?.language || 'en';
    SCI18n.setLanguage(lang);
    SC_SET_ENCODING_LANG(lang);
    langSelect.value = lang;
  }

  async function changeLanguage(lang) {
    SCI18n.setLanguage(lang);
    SC_SET_ENCODING_LANG(lang);

    // Save to storage
    const settings = await new Promise(resolve => {
      chrome.storage.local.get('settings', result => resolve(result.settings || {}));
    });
    settings.language = lang;
    await new Promise(resolve => {
      chrome.storage.local.set({ settings }, resolve);
    });

    // Notify background about language change
    await sendBackground({ action: 'setLanguage', language: lang });

    applyTranslations();

    // Re-render dynamic content
    if (currentSession) {
      showState('active');
    }
    await loadSessionsList();
  }

  function applyTranslations() {
    const t = SCI18n.t;

    // Status
    if (statusText.textContent === 'Checking...' || statusText.textContent === 'Проверка...') {
      statusText.textContent = t('status.checking');
    }

    // Buttons
    btnStart.textContent = t('btn.start');
    btnRotate.textContent = t('btn.rotate');
    btnReset.textContent = t('btn.reset');
    btnExport.textContent = t('btn.export');
    btnImport.textContent = t('btn.import');
    btnResetAll.textContent = t('btn.resetAll');

    // Sections
    document.getElementById('no-session-hint').textContent = t('session.noSession');
    document.getElementById('pending-text').textContent = t('session.pending');
    document.getElementById('pending-hint').textContent = t('session.pendingHint');
    document.getElementById('sessions-title').textContent = t('section.sessions');
    document.getElementById('hotkey-hint').innerHTML = t('session.hotkey');

    // Fingerprint
    document.getElementById('fp-label').textContent = t('session.fingerprint');
    document.getElementById('fp-hint-icon').title = t('session.fingerprintHint');

    // Rotate button title
    btnRotate.title = t('btn.rotate');
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
      }
    } catch (err) {
      console.error('[StealthChat] Key exchange error:', err);
      btnStart.textContent = t('btn.start');
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

  // --- Session selector (multiple sessions on same URL) ---

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
    fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:#555">${t('fp.loading')}</div>`;
    try {
      const result = await sendBackground({ action: 'getFingerprint', sessionId });
      if (result?.fingerprint) {
        const groups = result.fingerprint.split(' ');
        fingerprintGrid.innerHTML = groups
          .map(g => `<div class="fp-cell">${g}</div>`)
          .join('');
      } else {
        fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:#555">${t('fp.unavailable')}</div>`;
      }
    } catch {
      fingerprintGrid.innerHTML = `<div class="fp-cell" style="grid-column:1/-1;color:#ff6b7a">${t('fp.error')}</div>`;
    }
  }

  // --- Key rotation (PFS) ---

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
      sessionsList.innerHTML = `<p class="empty-state">${t('session.none')}</p>`;
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

  // --- Start ---
  init();
})();
