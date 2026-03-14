import fetch from "node-fetch";

export default async function handler(req, res) {
  const API_KEY = process.env.PROXYCHECK_KEY || "66367y-v34y45-009o19-6uy6d1";

  // Get visitor IP or custom IP
  let ip = req.query.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "8.8.8.8";
  if(ip.includes(",")) ip = ip.split(",")[0].trim();

  let result = null;
  try {
    const apiRes = await fetch(`https://proxycheck.io/v3/${ip}?vpn=1&key=${API_KEY}`);
    const data = await apiRes.json();
    result = data[ip];
  } catch {
    result = null;
  }

  // Send safe HTML
  res.setHeader("Content-Type", "text/html");
  res.status(200).end(`<!DOCTYPE html>
<html>
<head>
<title>IP Checker</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
<div class="bg-gray-800 p-8 rounded-xl w-full max-w-lg">
<h1 class="text-2xl font-bold mb-6 text-center">IP Security Check</h1>

<div class="mb-6 p-4 bg-gray-700 rounded">
<p class="text-sm text-gray-300">Your IP Address:</p>
<p class="text-lg font-bold">${ip}</p>
</div>

<form id="ip-form" class="mb-6" onsubmit="event.preventDefault();checkIP();">
<label class="block mb-2 text-sm">Check Another IP</label>
<input type="text" id="custom-ip" placeholder="Enter IP address" class="w-full p-3 rounded bg-gray-700 mb-3">
<button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded">Check IP</button>
</form>

<div id="result" class="bg-gray-700 p-4 rounded space-y-2">
${result ? `
<p><b>Checked IP:</b> ${ip}</p>
<p><b>Country:</b> ${result.location.country_name}</p>
<p><b>City:</b> ${result.location.city_name}</p>
<p><b>Provider:</b> ${result.network.provider}</p>
<p><b>VPN:</b> ${result.detections.vpn ? 'Yes' : 'No'}</b></p>
<p><b>Proxy:</b> ${result.detections.proxy ? 'Yes' : 'No'}</b></p>
<p><b>Hosting:</b> ${result.detections.hosting ? 'Yes' : 'No'}</b></p>
<p><b>Risk Score:</b> ${result.detections.risk}</p>
` : `<p class="text-red-400">Unable to fetch data</p>`}
</div>
</div>

<script>
async function checkIP() {
  const ip = document.getElementById('custom-ip').value.trim();
  if(!ip) return;
  const res = await fetch('/api?ip=' + ip);
  const html = await res.text();
  document.open();
  document.write(html);
  document.close();
}
</script>
</body>
</html>`);
}
