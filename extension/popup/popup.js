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

  let currentTab = null;
  let currentSession = null;
  let sessionsForUrl = [];

  // --- Init ---

  async function init() {
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

  function showState(state) {
    noSessionSection.classList.add('hidden');
    pendingSection.classList.add('hidden');
    activeSection.classList.add('hidden');

    switch (state) {
      case 'none':
        statusIndicator.className = 'indicator off';
        statusText.textContent = 'Not encrypted';
        noSessionSection.classList.remove('hidden');
        break;
      case 'pending':
        statusIndicator.className = 'indicator pending';
        statusText.textContent = 'Waiting for peer...';
        pendingSection.classList.remove('hidden');
        break;
      case 'active':
        statusIndicator.className = 'indicator on';
        statusText.textContent = 'Encryption active';
        activeSection.classList.remove('hidden');
        if (currentSession) {
          sessionLabel.textContent = currentSession.label || 'Encrypted session';
          toggleSession.checked = currentSession.enabled;
          loadFingerprint(currentSession.sessionId);

          // Show session selector if multiple sessions match this URL
          if (sessionsForUrl.length > 1) {
            sessionSelector.classList.remove('hidden');
            sessionSelect.innerHTML = sessionsForUrl.map(s =>
              `<option value="${s.sessionId}" ${s.sessionId === currentSession.sessionId ? 'selected' : ''}>${s.label || s.sessionId} ${s.enabled ? '' : '(off)'}</option>`
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
  }

  async function startKeyExchange() {
    if (!currentTab?.url) return;

    btnStart.disabled = true;
    btnStart.textContent = 'Generating...';

    try {
      const response = await sendBackground({
        action: 'startKeyExchange',
        url: currentTab.url
      });

      if (response?.encoded) {
        await navigator.clipboard.writeText(response.encoded);
        showState('pending');
        btnStart.textContent = 'Start Encryption';
        btnStart.disabled = false;
      }
    } catch (err) {
      console.error('[StealthChat] Key exchange error:', err);
      btnStart.textContent = 'Start Encryption';
      btnStart.disabled = false;
    }
  }

  async function resetSession() {
    if (!currentSession) return;
    if (!confirm('Reset encryption keys for this session?\nOld messages will not be decryptable.')) return;

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
    sessionLabel.textContent = selected.label || 'Encrypted session';
    toggleSession.checked = selected.enabled;
    await loadFingerprint(selected.sessionId);
    notifyContentScript('sessionUpdated');
  }

  // --- Fingerprint ---

  async function loadFingerprint(sessionId) {
    fingerprintGrid.innerHTML = '<div class="fp-cell" style="grid-column:1/-1;color:#555">loading...</div>';
    try {
      const result = await sendBackground({ action: 'getFingerprint', sessionId });
      if (result?.fingerprint) {
        // fingerprint is "a3b5 c7d9 e1f2 0a4b 8c3e 7f1d 2b9a 5e0c" — 8 groups of 4 hex
        // Render as 4×2 grid (8 cells, 4 per row)
        const groups = result.fingerprint.split(' ');
        fingerprintGrid.innerHTML = groups
          .map(g => `<div class="fp-cell">${g}</div>`)
          .join('');
      } else {
        fingerprintGrid.innerHTML = '<div class="fp-cell" style="grid-column:1/-1;color:#555">unavailable</div>';
      }
    } catch {
      fingerprintGrid.innerHTML = '<div class="fp-cell" style="grid-column:1/-1;color:#ff6b7a">error</div>';
    }
  }

  // --- Key rotation (PFS) ---

  async function rotateKey() {
    if (!currentSession) return;
    if (!confirm('Rotate encryption key?\nBoth you and your contact must rotate at the same time.\nOld messages stay readable (last 5 keys kept).')) return;

    btnRotate.disabled = true;
    btnRotate.textContent = 'Rotating...';

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
        btnRotate.textContent = `Rotated (#${result.rotationCounter})`;
        setTimeout(() => { btnRotate.textContent = 'Rotate Key'; }, 2000);
      }
    } catch (err) {
      console.error('[StealthChat] Key rotation error:', err);
    }

    btnRotate.disabled = false;
  }

  // --- Sessions list ---

  async function loadSessionsList() {
    const response = await sendBackground({ action: 'listSessions' });
    const sessions = response?.sessions || [];

    if (sessions.length === 0) {
      sessionsList.innerHTML = '<p class="empty-state">No sessions yet</p>';
      return;
    }

    sessionsList.innerHTML = sessions.map(s => `
      <div class="session-item" data-id="${s.sessionId}">
        <div class="session-item-status ${s.enabled ? 'active' : 'disabled'}"></div>
        <span class="session-item-label" title="${s.urlPattern || ''}${s.rotationCounter ? ' | rotations: ' + s.rotationCounter : ''}">${s.label || s.sessionId}</span>
        <button class="session-item-delete" data-id="${s.sessionId}" title="Delete">&times;</button>
      </div>
    `).join('');

    sessionsList.querySelectorAll('.session-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Delete this session?')) {
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
    if (!confirm('Delete ALL sessions and keys? This cannot be undone.\nOld messages will not be decryptable.')) return;

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
