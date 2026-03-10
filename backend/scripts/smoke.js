const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 8000);

const endpoints = [
  { name: 'Backend health', path: '/health', expectJson: true },
  { name: 'ML proxy health', path: '/api/v1/ml/health', expectJson: true }
];

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  let hasFailure = false;
  let backendReachable = true;

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.error(`[FAIL] ${endpoint.name}: ${res.status} ${res.statusText} (${url})`);
        hasFailure = true;
        continue;
      }

      if (endpoint.expectJson) {
        await res.json();
      }

      console.log(`[PASS] ${endpoint.name}: ${res.status} (${url})`);
    } catch (error) {
      console.error(`[FAIL] ${endpoint.name}: ${error.message} (${url})`);
      if (endpoint.path === '/health') {
        backendReachable = false;
      }
      hasFailure = true;
    }
  }

  if (hasFailure) {
    if (!backendReachable) {
      console.error('\nHint: start backend first (example: `npm start`), then rerun `npm run smoke`.');
    } else {
      console.error('\nHint: backend is up but one dependency check failed (often ML service URL).');
    }
    process.exit(1);
  }
}

run();
