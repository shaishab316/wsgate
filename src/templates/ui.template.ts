/*
 * nestjs-wsgate — UI Template
 *
 * Copyright (c) 2025 Shaishab
 * MIT License — https://opensource.org/licenses/MIT
 *
 * 3-panel Scalar-inspired interactive WebSocket documentation UI.
 *
 * Layout:
 *   [Sidebar — events list] | [Detail — emit panel] | [Log — live incoming events]
 */

/**
 * Generates the full HTML for the nestjs-wsgate interactive UI.
 *
 * @param title    - The title shown in the UI header.
 * @param basePath - The base path where wsgate is mounted (e.g. `/wsgate`).
 * @returns A complete, self-contained HTML string ready to be served.
 */
export const getUiHtml = (title: string, basePath: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — WsGate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:           #0d0d0f;
      --bg-2:         #111114;
      --bg-3:         #18181c;
      --border:       #222228;
      --text:         #e4e4e8;
      --text-muted:   #666672;
      --text-dim:     #33333d;
      --accent:       #6366f1;
      --accent-glow:  rgba(99,102,241,0.12);
      --accent-hover: #818cf8;
      --green:        #22c55e;
      --green-dim:    rgba(34,197,94,0.08);
      --red:          #ef4444;
      --yellow:       #eab308;
      --yellow-dim:   rgba(234,179,8,0.08);
      --blue:         #38bdf8;
      --blue-dim:     rgba(56,189,248,0.08);
      --mono:         'JetBrains Mono', monospace;
      --sans:         'IBM Plex Sans', sans-serif;
      --sidebar-w:    260px;
      --log-w:        300px;
      --header-h:     52px;
      --radius:       6px;
      --t:            0.15s ease;
    }

    html, body { height: 100%; overflow: hidden; }
    body { font-family: var(--sans); background: var(--bg); color: var(--text); font-size: 14px; }

    /* ── Layout ─────────────────────────────────────── */
    .layout {
      display: grid;
      grid-template-columns: var(--sidebar-w) 1fr var(--log-w);
      grid-template-rows: var(--header-h) 1fr;
      height: 100vh;
    }

    /* ── Header ─────────────────────────────────────── */
    .header {
      grid-column: 1 / -1;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px;
      background: var(--bg-2);
      border-bottom: 1px solid var(--border);
    }

    .logo { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem; letter-spacing: -0.02em; }
    .logo-icon { width: 26px; height: 26px; background: var(--accent); border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
    .logo-tag { font-size: 0.65rem; color: var(--text-muted); font-family: var(--mono); background: var(--bg-3); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }

    .conn-bar { display: flex; align-items: center; gap: 8px; }
    .conn-input { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); padding: 5px 10px; font-size: 0.78rem; font-family: var(--mono); width: 200px; outline: none; transition: border-color var(--t); }
    .conn-input:focus { border-color: var(--accent); }

    .btn { display: inline-flex; align-items: center; padding: 5px 14px; border-radius: var(--radius); font-size: 0.78rem; font-weight: 500; font-family: var(--sans); cursor: pointer; border: none; transition: background var(--t); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-emit { background: var(--accent); color: #fff; padding: 7px 22px; font-size: 0.82rem; border-radius: var(--radius); }
    .btn-emit:hover { background: var(--accent-hover); }
    .btn-sm { background: transparent; color: var(--text-muted); border: 1px solid var(--border); padding: 3px 10px; font-size: 0.7rem; border-radius: var(--radius); }
    .btn-sm:hover { color: var(--text); }

    .status-pill { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-family: var(--mono); color: var(--text-muted); background: var(--bg-3); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); transition: background var(--t), box-shadow var(--t); }
    .status-dot.on { background: var(--green); box-shadow: 0 0 6px var(--green); }

    /* ── Sidebar ─────────────────────────────────────── */
    .sidebar { background: var(--bg-2); border-right: 1px solid var(--border); overflow-y: auto; padding: 10px 0; }
    .sidebar::-webkit-scrollbar { width: 3px; }
    .sidebar::-webkit-scrollbar-thumb { background: var(--border); }

    .sg-label { padding: 8px 16px 4px; font-size: 0.62rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }
    .si { display: flex; align-items: center; gap: 8px; padding: 7px 16px; cursor: pointer; border-left: 2px solid transparent; transition: background var(--t), border-color var(--t); }
    .si:hover { background: var(--bg-3); }
    .si.active { background: var(--accent-glow); border-left-color: var(--accent); }
    .si.active .si-name { color: var(--accent-hover); }
    .si-name { font-family: var(--mono); font-size: 0.78rem; color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .badge { font-size: 0.58rem; font-weight: 700; padding: 1px 6px; border-radius: 999px; font-family: var(--mono); text-transform: uppercase; flex-shrink: 0; }
    .badge-none   { background: var(--green-dim);  color: var(--green);  }
    .badge-bearer { background: var(--yellow-dim); color: var(--yellow); }
    .badge-basic  { background: var(--blue-dim);   color: var(--blue);   }

    /* ── Main ────────────────────────────────────────── */
    .main { background: var(--bg); overflow-y: auto; display: flex; flex-direction: column; }
    .main::-webkit-scrollbar { width: 3px; }
    .main::-webkit-scrollbar-thumb { background: var(--border); }

    .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-dim); font-size: 0.82rem; }
    .empty-icon { font-size: 2rem; opacity: 0.15; }

    .detail { padding: 24px 28px; }
    .detail-top { padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid var(--border); }
    .detail-name { font-family: var(--mono); font-size: 1.15rem; font-weight: 500; letter-spacing: -0.02em; }
    .detail-desc { margin-top: 5px; font-size: 0.82rem; color: var(--text-muted); }
    .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
    .chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-family: var(--mono); background: var(--bg-3); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; color: var(--text-muted); }
    .chip b { color: var(--text-dim); font-weight: 400; }

    .sec { margin-bottom: 18px; }
    .sec-title { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 7px; display: flex; justify-content: space-between; align-items: center; }
    .sec-tag { font-family: var(--mono); font-size: 0.7rem; color: var(--accent-hover); background: var(--accent-glow); border: 1px solid rgba(99,102,241,0.2); border-radius: 4px; padding: 1px 7px; text-transform: none; letter-spacing: 0; }

    .field { width: 100%; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); padding: 8px 12px; font-size: 0.82rem; font-family: var(--mono); outline: none; transition: border-color var(--t), box-shadow var(--t); }
    .field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea.field { min-height: 120px; resize: vertical; line-height: 1.6; }

    .emit-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .emit-hint { font-size: 0.72rem; font-family: var(--mono); color: var(--green); }

    .res-box { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; font-family: var(--mono); font-size: 0.78rem; min-height: 70px; color: var(--text-dim); white-space: pre-wrap; word-break: break-all; line-height: 1.6; transition: border-color var(--t), color var(--t); }
    .res-box.got { color: var(--green); border-color: rgba(34,197,94,0.25); }

    /* ── Log Panel ───────────────────────────────────── */
    .log-panel { background: var(--bg-2); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
    .log-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .log-head-left { display: flex; align-items: center; gap: 7px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .log-cnt { font-size: 0.65rem; font-family: var(--mono); background: var(--accent-glow); color: var(--accent-hover); border: 1px solid rgba(99,102,241,0.2); border-radius: 999px; padding: 0 7px; min-width: 20px; text-align: center; }
    .log-body { flex: 1; overflow-y: auto; padding: 8px; }
    .log-body::-webkit-scrollbar { width: 3px; }
    .log-body::-webkit-scrollbar-thumb { background: var(--border); }

    .log-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 8px; color: var(--text-dim); font-size: 0.75rem; text-align: center; opacity: 0.6; }

    .log-entry { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 9px 11px; margin-bottom: 7px; animation: fadeIn 0.12s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }

    .log-entry-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    .log-entry-event { font-family: var(--mono); font-size: 0.73rem; color: var(--accent-hover); font-weight: 500; }
    .log-entry-time { font-family: var(--mono); font-size: 0.63rem; color: var(--text-dim); }
    .log-entry-data { font-family: var(--mono); font-size: 0.73rem; color: var(--green); white-space: pre-wrap; word-break: break-all; line-height: 1.5; }
  </style>
</head>
<body>

<div class="layout">

  <!-- Header -->
  <header class="header">
    <div class="logo">
      <div class="logo-icon">⚡</div>
      ${title}
      <span class="logo-tag">wsgate</span>
    </div>
    <div class="conn-bar">
      <input class="conn-input" id="serverUrl" type="text" placeholder="ws://localhost:3000" />
      <button class="btn btn-primary" onclick="connectSocket()">Connect</button>
      <div class="status-pill">
        <div class="status-dot" id="dot"></div>
        <span id="statusTxt">Disconnected</span>
      </div>
    </div>
  </header>

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div style="padding:16px;color:var(--text-dim);font-size:0.78rem">Loading...</div>
  </aside>

  <!-- Main -->
  <main class="main" id="main">
    <div class="empty">
      <div class="empty-icon">⚡</div>
      <span>Select an event from the sidebar</span>
    </div>
  </main>

  <!-- Live Log -->
  <aside class="log-panel">
    <div class="log-head">
      <div class="log-head-left">
        📡 Live Events
        <span class="log-cnt" id="logCnt">0</span>
      </div>
      <button class="btn btn-sm" onclick="clearLog()">Clear</button>
    </div>
    <div class="log-body" id="logBody">
      <div class="log-empty-state">
        <div style="font-size:1.5rem;opacity:0.3">📡</div>
        <p>Connect to see<br/>incoming events</p>
      </div>
    </div>
  </aside>

</div>

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script>
  const BASE_PATH = '${basePath}';
  let socket      = null;
  let allEvents   = [];
  let activeIdx   = null;
  let logCnt      = 0;

  document.getElementById('serverUrl').value = window.location.origin;

  // ── Load events ───────────────────────────────────────
  fetch(BASE_PATH + '/events.json')
    .then(r => r.json())
    .then(({ events }) => { allEvents = events; buildSidebar(events); })
    .catch(() => {
      document.getElementById('sidebar').innerHTML =
        '<div style="padding:16px;color:var(--red);font-size:0.78rem">Failed to load events.</div>';
    });

  // ── Build sidebar ─────────────────────────────────────
  function buildSidebar(events) {
    const el = document.getElementById('sidebar');
    if (!events.length) {
      el.innerHTML = '<div style="padding:16px;color:var(--text-dim);font-size:0.78rem">No @WsDoc() events found.</div>';
      return;
    }

    const groups = events.reduce((acc, ev, i) => {
      (acc[ev.gatewayName] = acc[ev.gatewayName] || []).push({ ...ev, _i: i });
      return acc;
    }, {});

    el.innerHTML = Object.entries(groups).map(([gw, evs]) => \`
      <div>
        <div class="sg-label">\${gw}</div>
        \${evs.map(ev => \`
          <div class="si" id="si-\${ev._i}" onclick="selectEvent(\${ev._i})">
            <span class="si-name">⚡ \${ev.event}</span>
            <span class="badge badge-\${ev.auth||'none'}">\${ev.auth||'none'}</span>
          </div>
        \`).join('')}
      </div>
    \`).join('');
  }

  // ── Select event → render detail ──────────────────────
  function selectEvent(i) {
    activeIdx = i;
    const ev  = allEvents[i];

    document.querySelectorAll('.si').forEach(el => el.classList.remove('active'));
    document.getElementById('si-' + i)?.classList.add('active');

    document.getElementById('main').innerHTML = \`
      <div class="detail">

        <div class="detail-top">
          <div class="detail-name">⚡ \${ev.event}</div>
          \${ev.description ? \`<div class="detail-desc">\${ev.description}</div>\` : ''}
          <div class="chips">
            <div class="chip"><b>gateway</b>\${ev.gatewayName}</div>
            <div class="chip"><b>handler</b>\${ev.handlerName}</div>
            \${ev.response ? \`<div class="chip"><b>emits</b>\${ev.response}</div>\` : ''}
            <span class="badge badge-\${ev.auth||'none'}" style="align-self:center">
              \${(ev.auth||'none').toUpperCase()}
            </span>
          </div>
        </div>

        \${ev.auth === 'bearer' ? \`
          <div class="sec">
            <div class="sec-title">🔒 Bearer Token</div>
            <input class="field" id="tok-\${i}" type="text" placeholder="eyJhbGci..." />
          </div>
        \` : ''}

        \${ev.payload ? \`
          <div class="sec">
            <div class="sec-title">📦 Payload (JSON)</div>
            <textarea class="field" id="pl-\${i}" spellcheck="false">\${JSON.stringify(
              Object.fromEntries(Object.keys(ev.payload).map(k => [k,''])),
              null, 2
            )}</textarea>
          </div>
        \` : ''}

        <div class="emit-row">
          <button class="btn btn-emit" onclick="doEmit('\${ev.event}',\${i},'\${ev.auth||'none'}')">▶ Emit</button>
          <span class="emit-hint" id="eh-\${i}"></span>
        </div>

        \${ev.response ? \`
          <div class="sec">
            <div class="sec-title">
              📥 Last Response
              <span class="sec-tag">\${ev.response}</span>
            </div>
            <div class="res-box" id="rb-\${i}">Waiting for response...</div>
          </div>
        \` : ''}

      </div>
    \`;

    // Register persistent listener for response event
    if (socket?.connected && ev.response) {
      listenFor(ev.response, i);
    }
  }

  // ── Persistent listener for a specific response event ─
  function listenFor(responseEvent, i) {
    socket.off(responseEvent);
    socket.on(responseEvent, (data) => {
      const box = document.getElementById('rb-' + i);
      if (box) {
        box.className = 'res-box got';
        box.textContent = typeof data === 'object'
          ? JSON.stringify(data, null, 2)
          : String(data);
      }
    });
  }

  // ── Connect ───────────────────────────────────────────
  function connectSocket() {
    const url = document.getElementById('serverUrl').value.trim();
    if (!url) return;
    if (socket) socket.disconnect();

    socket = io(url, { transports: ['websocket','polling'] });

    socket.on('connect', () => {
      setStatus(true);

      // Listen to ALL events → live log
      socket.onAny((event, data) => addLog(event, data));

      // Re-register response listener for selected event
      if (activeIdx !== null) {
        const ev = allEvents[activeIdx];
        if (ev?.response) listenFor(ev.response, activeIdx);
      }
    });

    socket.on('disconnect', () => setStatus(false));
    socket.on('connect_error', () => setStatus(false));
  }

  function setStatus(on) {
    document.getElementById('dot').classList.toggle('on', on);
    document.getElementById('statusTxt').textContent = on ? 'Connected' : 'Disconnected';
  }

  // ── Emit ──────────────────────────────────────────────
  function doEmit(eventName, i, auth) {
    if (!socket?.connected) { alert('Connect first!'); return; }

    let payload = {};
    const pl = document.getElementById('pl-' + i);
    if (pl) {
      try { payload = JSON.parse(pl.value); }
      catch { alert('Invalid JSON payload'); return; }
    }

    if (auth === 'bearer') {
      const tok = document.getElementById('tok-' + i)?.value?.trim();
      if (tok) payload._token = tok;
    }

    socket.emit(eventName, payload);

    const eh = document.getElementById('eh-' + i);
    if (eh) { eh.textContent = 'Emitted ✓'; setTimeout(() => { eh.textContent = ''; }, 1500); }
  }

  // ── Add entry to live log ─────────────────────────────
  function addLog(event, data) {
    logCnt++;
    document.getElementById('logCnt').textContent = logCnt;

    const body = document.getElementById('logBody');
    const empty = body.querySelector('.log-empty-state');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const formatted = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = \`
      <div class="log-entry-top">
        <span class="log-entry-event">⚡ \${event}</span>
        <span class="log-entry-time">\${time}</span>
      </div>
      <div class="log-entry-data">\${formatted}</div>
    \`;

    body.insertBefore(entry, body.firstChild);
  }

  // ── Clear log ─────────────────────────────────────────
  function clearLog() {
    logCnt = 0;
    document.getElementById('logCnt').textContent = '0';
    document.getElementById('logBody').innerHTML = \`
      <div class="log-empty-state">
        <div style="font-size:1.5rem;opacity:0.3">📡</div>
        <p>Connect to see<br/>incoming events</p>
      </div>
    \`;
  }
</script>
</body>
</html>
`;
