/**
 * Generates the full HTML for the nestjs-wsgate interactive UI.
 *
 * @param title    - The title shown in the UI header.
 * @param basePath - The base path where wsgate is mounted.
 * @returns A complete HTML string ready to be served.
 */
export const getUiHtml = (title: string, basePath: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #0f0f0f; color: #e2e2e2; }
    header {
      background: #1a1a1a;
      padding: 16px 24px;
      border-bottom: 1px solid #2a2a2a;
      font-size: 1.2rem;
      font-weight: bold;
      color: #7dd3fc;
    }
    .container { max-width: 860px; margin: 32px auto; padding: 0 16px; }
    .event-card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .event-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      background: #1f1f1f;
    }
    .event-name { font-weight: bold; color: #7dd3fc; font-size: 0.95rem; }
    .event-desc { font-size: 0.8rem; color: #888; margin-top: 2px; }
    .badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; font-weight: bold; }
    .badge-bearer { background: #854d0e; color: #fef08a; }
    .badge-none   { background: #14532d; color: #86efac; }
    .badge-basic  { background: #1e3a5f; color: #93c5fd; }
    .event-body { padding: 16px; display: none; border-top: 1px solid #2a2a2a; }
    .event-body.open { display: block; }
    label { font-size: 0.78rem; color: #aaa; display: block; margin-bottom: 4px; }
    input[type="text"], textarea {
      width: 100%;
      background: #111;
      border: 1px solid #333;
      border-radius: 6px;
      color: #e2e2e2;
      padding: 8px 10px;
      font-size: 0.85rem;
      margin-bottom: 12px;
      outline: none;
    }
    textarea { min-height: 100px; font-family: monospace; resize: vertical; }
    button {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    button:hover { background: #1d4ed8; }
    .response-box {
      margin-top: 12px;
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      padding: 10px;
      font-size: 0.8rem;
      font-family: monospace;
      min-height: 60px;
      color: #86efac;
      white-space: pre-wrap;
    }
    .meta-row { font-size: 0.78rem; color: #666; margin-bottom: 8px; }
    .meta-row span { color: #7dd3fc; }
  </style>
</head>
<body>

<header>⚡ ${title} — nestjs-wsgate</header>

<div class="container" id="app">
  <p style="color:#555">Loading events...</p>
</div>

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script>
  const BASE_PATH = '${basePath}';
  let socket = null;

  // ── Fetch events ──────────────────────────────────────
  fetch(BASE_PATH + '/events.json')
    .then(r => r.json())
    .then(({ events }) => renderEvents(events));

  // ── Render ────────────────────────────────────────────
  function renderEvents(events) {
    const app = document.getElementById('app');

    if (!events.length) {
      app.innerHTML = '<p style="color:#555">No @WsDoc() events found.</p>';
      return;
    }

    app.innerHTML = '';

    // Connection bar
    const connBar = document.createElement('div');
    connBar.style = 'display:flex;gap:8px;margin-bottom:20px;';
    connBar.innerHTML = \`
      <input id="serverUrl" type="text"
        value="\${window.location.origin}"
        style="flex:1;margin:0"
        placeholder="ws://localhost:3000" />
      <button onclick="connectSocket()">Connect</button>
      <span id="connStatus"
        style="align-self:center;font-size:0.8rem;color:#555">
        ● Disconnected
      </span>
    \`;
    app.appendChild(connBar);

    events.forEach((ev, i) => {
      const card = document.createElement('div');
      card.className = 'event-card';
      const badgeClass = 'badge-' + (ev.auth || 'none');

      card.innerHTML = \`
        <div class="event-header" onclick="toggleCard(\${i})">
          <div>
            <div class="event-name">⚡ \${ev.event}</div>
            <div class="event-desc">\${ev.description || ''}</div>
          </div>
          <span class="badge \${badgeClass}">\${(ev.auth || 'none').toUpperCase()}</span>
        </div>
        <div class="event-body" id="body-\${i}">
          \${ev.auth === 'bearer' ? \`
            <label>Bearer Token</label>
            <input type="text" id="token-\${i}" placeholder="eyJhbGci..." />
          \` : ''}
          \${ev.payload ? \`
            <label>Payload (JSON)</label>
            <textarea id="payload-\${i}">\${JSON.stringify(
              Object.fromEntries(Object.keys(ev.payload).map(k => [k, ''])),
              null, 2
            )}</textarea>
          \` : ''}
          \${ev.response ? \`
            <div class="meta-row">Response event: <span>\${ev.response}</span></div>
          \` : ''}
          <div class="meta-row">
            Gateway: <span>\${ev.gatewayName}</span>
            · Handler: <span>\${ev.handlerName}</span>
          </div>
          <button onclick="emitEvent('\${ev.event}', \${i}, '\${ev.response || ''}', '\${ev.auth || 'none'}')">
            ▶ Emit
          </button>
          <div class="response-box" id="res-\${i}">Waiting for response...</div>
        </div>
      \`;

      app.appendChild(card);
    });
  }

  // ── Toggle card ───────────────────────────────────────
  function toggleCard(i) {
    document.getElementById('body-' + i).classList.toggle('open');
  }

  // ── Connect socket ────────────────────────────────────
  function connectSocket() {
    const url = document.getElementById('serverUrl').value;
    if (socket) socket.disconnect();

    socket = io(url);

    socket.on('connect', () => {
      document.getElementById('connStatus').textContent = '● Connected';
      document.getElementById('connStatus').style.color = '#86efac';
    });

    socket.on('disconnect', () => {
      document.getElementById('connStatus').textContent = '● Disconnected';
      document.getElementById('connStatus').style.color = '#555';
    });
  }

  // ── Emit event ────────────────────────────────────────
  function emitEvent(eventName, i, responseEvent, auth) {
    if (!socket || !socket.connected) {
      alert('Connect to the server first!');
      return;
    }

    let payload = {};
    const payloadEl = document.getElementById('payload-' + i);
    if (payloadEl) {
      try { payload = JSON.parse(payloadEl.value); }
      catch { alert('Invalid JSON payload'); return; }
    }

    if (auth === 'bearer') {
      const token = document.getElementById('token-' + i)?.value;
      if (token) payload._token = token;
    }

    if (responseEvent) {
      socket.once(responseEvent, (data) => {
        document.getElementById('res-' + i).textContent =
          JSON.stringify(data, null, 2);
      });
    }

    socket.emit(eventName, payload);
    document.getElementById('res-' + i).textContent = 'Emitted! Waiting...';
  }
</script>
</body>
</html>
`;
