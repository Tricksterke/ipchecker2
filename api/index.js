import fetch from "node-fetch";

export default async function handler(req, res) {
  const API_KEY = process.env.PROXYCHECK_KEY || "66367y-v34y45-009o19-6uy6d1";

  let ip = req.query.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "8.8.8.8";
  if (ip.includes(",")) ip = ip.split(",")[0].trim();

  let result = null;
  let queryTime = null;
  let rawStatus = null;

  try {
    const apiRes = await fetch(`https://proxycheck.io/v3/${ip}?vpn=1&key=${API_KEY}`);
    const data = await apiRes.json();
    result = data[ip];
    queryTime = data.query_time;
    rawStatus = data.status;
  } catch {
    result = null;
  }

  const esc = (v) =>
    v == null ? '<span class="nil">—</span>' : String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const flag = (val) =>
    val
      ? '<span class="badge bad">YES</span>'
      : '<span class="badge good">NO</span>';

  const riskColor = (r) => {
    if (r == null) return "var(--muted)";
    if (r >= 75) return "var(--red)";
    if (r >= 40) return "var(--amber)";
    return "var(--green)";
  };

  const riskVal = result?.detections?.risk ?? null;

  res.setHeader("Content-Type", "text/html");
  res.status(200).end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>IP Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  :root {
    --bg: #080c10;
    --surface: #0d1117;
    --surface2: #161b22;
    --border: #21262d;
    --border2: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --red: #f85149;
    --amber: #d29922;
    --purple: #bc8cff;
    --cyan: #79c0ff;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    padding: 2rem 1rem;
  }

  /* Subtle grid background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(88,166,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(88,166,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .wrap {
    position: relative;
    z-index: 1;
    max-width: 860px;
    margin: 0 auto;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .logo {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  h1 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  h1 span { color: var(--accent); }

  .status-bar {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted);
    margin-left: auto;
    text-align: right;
    line-height: 1.6;
  }

  /* Search */
  .search-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 0.5rem;
  }

  .search-bar input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }

  .search-bar input::placeholder { color: var(--muted); }

  .search-bar button {
    background: var(--accent);
    color: #000;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1.25rem;
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .search-bar button:hover { opacity: 0.85; }

  /* IP Hero */
  .ip-hero {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .ip-address {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--cyan);
    letter-spacing: -0.03em;
  }

  .ip-meta {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.2rem;
    font-family: 'IBM Plex Mono', monospace;
  }

  .risk-gauge {
    text-align: right;
  }

  .risk-score {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1;
    color: ${riskColor(riskVal)};
  }

  .risk-label {
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 0.2rem;
  }

  /* Grid layout */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .grid .full { grid-column: 1; }
  }

  .full { grid-column: 1 / -1; }

  /* Cards */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card:nth-child(1) { animation-delay: 0.05s; }
  .card:nth-child(2) { animation-delay: 0.10s; }
  .card:nth-child(3) { animation-delay: 0.15s; }
  .card:nth-child(4) { animation-delay: 0.20s; }
  .card:nth-child(5) { animation-delay: 0.25s; }
  .card:nth-child(6) { animation-delay: 0.30s; }

  .card-header {
    padding: 0.65rem 1rem;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .card-header .icon { opacity: 0.8; }

  .rows { padding: 0.5rem 0; }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 1rem;
    gap: 1rem;
    border-bottom: 1px solid rgba(33,38,45,0.6);
    transition: background 0.1s;
  }

  .row:last-child { border-bottom: none; }
  .row:hover { background: rgba(88,166,255,0.04); }

  .row-key {
    font-size: 0.8rem;
    color: var(--muted);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 110px;
  }

  .row-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.82rem;
    color: var(--text);
    text-align: right;
    word-break: break-all;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 0.1rem 0.55rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .badge.good { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid rgba(63,185,80,0.3); }
  .badge.bad  { background: rgba(248,81,73,0.15);  color: var(--red);   border: 1px solid rgba(248,81,73,0.3); }
  .badge.warn { background: rgba(210,153,34,0.15); color: var(--amber); border: 1px solid rgba(210,153,34,0.3); }
  .badge.info { background: rgba(88,166,255,0.12); color: var(--cyan);  border: 1px solid rgba(88,166,255,0.25); }

  .nil { color: var(--border2); font-style: italic; }

  /* Detection flags grid */
  .flags {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.6rem;
    padding: 0.85rem 1rem;
  }

  .flag-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .flag-name {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  /* Confidence bar */
  .conf-bar {
    height: 4px;
    background: var(--border2);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.25rem;
  }

  .conf-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--purple));
    border-radius: 2px;
    width: ${result?.detections?.confidence ?? 0}%;
    transition: width 1s ease;
  }

  /* Coords */
  .coord-link {
    color: var(--accent);
    text-decoration: none;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.82rem;
  }

  .coord-link:hover { text-decoration: underline; }

  /* Error */
  .error-card {
    background: rgba(248,81,73,0.07);
    border: 1px solid rgba(248,81,73,0.25);
    border-radius: 10px;
    padding: 2rem;
    text-align: center;
    color: var(--red);
    font-family: 'IBM Plex Mono', monospace;
  }

  /* Loading overlay */
  #loading {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(8,12,16,0.85);
    backdrop-filter: blur(4px);
    z-index: 100;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
    font-family: 'IBM Plex Mono', monospace;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .spinner {
    width: 32px; height: 32px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<div id="loading"><div class="spinner"></div>Querying intelligence...</div>

<div class="wrap">

  <header>
    <div class="logo">🛡</div>
    <div>
      <h1>IP <span>Intelligence</span></h1>
      <div style="font-size:0.75rem;color:var(--muted);margin-top:0.1rem;font-family:'IBM Plex Mono',monospace;">
        powered by proxycheck.io
      </div>
    </div>
    <div class="status-bar">
      ${rawStatus ? `STATUS: <span style="color:var(--green)">${esc(rawStatus).toUpperCase()}</span><br/>` : ''}
      ${queryTime != null ? `QUERY: ${esc(queryTime)}ms` : ''}
    </div>
  </header>

  <div class="search-bar">
    <input type="text" id="custom-ip" placeholder="Enter any IPv4 or IPv6 address…" value="${esc(ip)}"/>
    <button onclick="checkIP()">Analyze</button>
  </div>

  ${result ? `

  <div class="ip-hero">
    <div>
      <div class="ip-address">${esc(ip)}</div>
      <div class="ip-meta">
        ${esc(result.location?.city_name)} · ${esc(result.location?.country_name)} · ${esc(result.network?.type)}
      </div>
    </div>
    <div class="risk-gauge">
      <div class="risk-score">${riskVal ?? '—'}</div>
      <div class="risk-label">Risk Score</div>
    </div>
  </div>

  <div class="grid">

    <!-- Network -->
    <div class="card">
      <div class="card-header"><span class="icon">◈</span> Network</div>
      <div class="rows">
        <div class="row"><span class="row-key">ASN</span><span class="row-val">${esc(result.network?.asn)}</span></div>
        <div class="row"><span class="row-key">Range</span><span class="row-val">${esc(result.network?.range)}</span></div>
        <div class="row"><span class="row-key">Hostname</span><span class="row-val">${esc(result.network?.hostname)}</span></div>
        <div class="row"><span class="row-key">Provider</span><span class="row-val">${esc(result.network?.provider)}</span></div>
        <div class="row"><span class="row-key">Organisation</span><span class="row-val">${esc(result.network?.organisation)}</span></div>
        <div class="row"><span class="row-key">Type</span><span class="row-val"><span class="badge info">${esc(result.network?.type)}</span></span></div>
      </div>
    </div>

    <!-- Location -->
    <div class="card">
      <div class="card-header"><span class="icon">◎</span> Location</div>
      <div class="rows">
        <div class="row"><span class="row-key">Continent</span><span class="row-val">${esc(result.location?.continent_name)} (${esc(result.location?.continent_code)})</span></div>
        <div class="row"><span class="row-key">Country</span><span class="row-val">${esc(result.location?.country_name)} · ${esc(result.location?.country_code)}</span></div>
        <div class="row"><span class="row-key">Region</span><span class="row-val">${esc(result.location?.region_name)} (${esc(result.location?.region_code)})</span></div>
        <div class="row"><span class="row-key">City</span><span class="row-val">${esc(result.location?.city_name)}</span></div>
        <div class="row"><span class="row-key">Postal</span><span class="row-val">${esc(result.location?.postal_code)}</span></div>
        <div class="row"><span class="row-key">Timezone</span><span class="row-val">${esc(result.location?.timezone)}</span></div>
        <div class="row">
          <span class="row-key">Coordinates</span>
          <span class="row-val">
            ${result.location?.latitude != null
              ? `<a class="coord-link" href="https://maps.google.com/?q=${result.location.latitude},${result.location.longitude}" target="_blank">${result.location.latitude}, ${result.location.longitude} ↗</a>`
              : '<span class="nil">—</span>'
            }
          </span>
        </div>
        ${result.location?.currency ? `
        <div class="row"><span class="row-key">Currency</span><span class="row-val">${esc(result.location.currency.name)} · ${esc(result.location.currency.code)} (${esc(result.location.currency.symbol)})</span></div>
        ` : ''}
      </div>
    </div>

    <!-- Detections -->
    <div class="card full">
      <div class="card-header"><span class="icon">⬡</span> Threat Detections</div>
      <div class="flags">
        <div class="flag-item"><span class="flag-name">Proxy</span>${flag(result.detections?.proxy)}</div>
        <div class="flag-item"><span class="flag-name">VPN</span>${flag(result.detections?.vpn)}</div>
        <div class="flag-item"><span class="flag-name">Tor</span>${flag(result.detections?.tor)}</div>
        <div class="flag-item"><span class="flag-name">Hosting</span>${flag(result.detections?.hosting)}</div>
        <div class="flag-item"><span class="flag-name">Compromised</span>${flag(result.detections?.compromised)}</div>
        <div class="flag-item"><span class="flag-name">Scraper</span>${flag(result.detections?.scraper)}</div>
        <div class="flag-item"><span class="flag-name">Anonymous</span>${flag(result.detections?.anonymous)}</div>
        <div class="flag-item">
          <span class="flag-name">Confidence</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:0.82rem;color:var(--text)">${esc(result.detections?.confidence)}%</span>
          <div class="conf-bar"><div class="conf-fill"></div></div>
        </div>
        <div class="flag-item"><span class="flag-name">First Seen</span><span style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:var(--text)">${esc(result.detections?.first_seen)}</span></div>
        <div class="flag-item"><span class="flag-name">Last Seen</span><span style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:var(--text)">${esc(result.detections?.last_seen)}</span></div>
      </div>
    </div>

    <!-- Device Estimate -->
    ${result.device_estimate ? `
    <div class="card">
      <div class="card-header"><span class="icon">◻</span> Device Estimate</div>
      <div class="rows">
        <div class="row"><span class="row-key">Address</span><span class="row-val">${esc(result.device_estimate?.address)}</span></div>
        <div class="row"><span class="row-key">Subnet Size</span><span class="row-val">${esc(result.device_estimate?.subnet)}</span></div>
      </div>
    </div>
    ` : ''}

    <!-- Detection History -->
    ${result.detection_history ? `
    <div class="card">
      <div class="card-header"><span class="icon">◷</span> Detection History</div>
      <div class="rows">
        <div class="row">
          <span class="row-key">Delisted</span>
          <span class="row-val">${result.detection_history.delisted
            ? '<span class="badge good">YES</span>'
            : '<span class="badge warn">NO</span>'
          }</span>
        </div>
        <div class="row">
          <span class="row-key">Delist Date</span>
          <span class="row-val">${esc(result.detection_history?.delist_datetime)}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Attack History -->
    <div class="card">
      <div class="card-header"><span class="icon">◬</span> Attack History</div>
      <div class="rows">
        <div class="row">
          <span class="row-key">Status</span>
          <span class="row-val">
            ${result.attack_history
              ? '<span class="badge bad">PRESENT</span>'
              : '<span class="badge good">NONE</span>'
            }
          </span>
        </div>
      </div>
    </div>

    <!-- Operator -->
    <div class="card">
      <div class="card-header"><span class="icon">◉</span> Operator</div>
      <div class="rows">
        <div class="row">
          <span class="row-key">Operator</span>
          <span class="row-val">${esc(result.operator)}</span>
        </div>
      </div>
    </div>

    <!-- Meta -->
    <div class="card">
      <div class="card-header"><span class="icon">◌</span> Record Meta</div>
      <div class="rows">
        <div class="row"><span class="row-key">Last Updated</span><span class="row-val">${esc(result.last_updated)}</span></div>
        <div class="row"><span class="row-key">Query Time</span><span class="row-val">${esc(queryTime)}ms</span></div>
        <div class="row"><span class="row-key">API Status</span><span class="row-val"><span class="badge good">${esc(rawStatus)?.toUpperCase()}</span></span></div>
      </div>
    </div>

  </div>

  ` : `
  <div class="error-card">
    ⚠ Unable to retrieve data for <code>${esc(ip)}</code>.<br/>
    <span style="color:var(--muted);font-size:0.8rem;margin-top:0.5rem;display:block;">Check the IP address and try again.</span>
  </div>
  `}

</div>

<script>
async function checkIP() {
  const ip = document.getElementById('custom-ip').value.trim();
  if (!ip) return;
  document.getElementById('loading').style.display = 'flex';
  try {
    const res = await fetch('/api?ip=' + encodeURIComponent(ip));
    const html = await res.text();
    document.open();
    document.write(html);
    document.close();
  } catch {
    document.getElementById('loading').style.display = 'none';
  }
}

document.getElementById('custom-ip').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkIP();
});
</script>
</body>
</html>`);
}
