const base = 'https://kelmah-api-gateway-gf3g.onrender.com';
const email = 'giftyafisa@gmail.com';
const currentPassword = '11221122Tg';
const temporaryPassword = 'TempPassword123!A';

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const sanitize = (value) => String(value).replace(/\s+/g, ' ').slice(0, 700);

async function request(label, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(base + path, {
      method: options.method || 'GET',
      headers,
      body,
      redirect: options.redirect || 'follow',
      signal: AbortSignal.timeout(options.timeoutMs || 70000),
    });
    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    console.log(`${label}_status=${response.status}`);
    if (text) {
      console.log(`${label}_body=${sanitize(text)}`);
    }

    return {
      ok: response.ok,
      status: response.status,
      text,
      json,
      headers: response.headers,
    };
  } catch (error) {
    console.log(`${label}_status=ERR`);
    console.log(`${label}_error=${sanitize(error.message)}`);
    return {
      ok: false,
      status: 'ERR',
      error: error.message,
    };
  }
}

function extractToken(payload) {
  return payload?.data?.token || payload?.token || payload?.data?.accessToken || null;
}

function extractFirstArray(payload) {
  const candidates = [
    payload?.data?.items,
    payload?.data?.workers,
    payload?.data?.jobs,
    payload?.data?.portfolioItems,
    payload?.data?.certificates,
    payload?.data?.skills,
    payload?.data?.workHistory,
    payload?.items,
    payload?.workers,
    payload?.jobs,
    payload,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractId(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const direct = value.id || value._id || value.userId || value.workerId || null;
  if (direct) {
    return typeof direct === 'string' ? direct : String(direct);
  }

  return null;
}

async function waitForGateway() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    console.log(`gateway_poll=${attempt}`);
    const response = await request('health', '/health', { timeoutMs: 30000 });
    if (response.status === 200) {
      return;
    }
    if (attempt < 3) {
      await sleep(5000);
    }
  }
}

async function main() {
  await waitForGateway();

  const workersResponse = await request('workers_list', '/api/users/workers?limit=1', { timeoutMs: 60000 });
  const workers = extractFirstArray(workersResponse.json);
  const firstWorker = workers[0] || null;
  const workerId = extractId(firstWorker);
  console.log(`worker_id=${workerId || 'NONE'}`);

  if (workerId) {
    await request('worker_skills', `/api/users/workers/${workerId}/skills`, { timeoutMs: 60000 });
    await request('worker_work_history', `/api/users/workers/${workerId}/work-history`, { timeoutMs: 60000 });
    await request('worker_portfolio', `/api/users/workers/${workerId}/portfolio`, { timeoutMs: 60000 });
    await request('worker_certificates', `/api/users/workers/${workerId}/certificates`, { timeoutMs: 60000 });
  }

  const loginResponse = await request('login', '/api/auth/login', {
    method: 'POST',
    body: { email, password: currentPassword },
  });
  const token = extractToken(loginResponse.json);
  console.log(`login_token_present=${token ? 'yes' : 'no'}`);

  if (!token) {
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  await request('me', '/api/auth/me', { headers: authHeaders, timeoutMs: 60000 });

  const myJobsResponse = await request('my_jobs', '/api/jobs/my-jobs?limit=1', {
    headers: authHeaders,
    timeoutMs: 60000,
  });
  const jobs = extractFirstArray(myJobsResponse.json);
  const firstJob = jobs[0] || null;
  const jobId = extractId(firstJob);
  console.log(`job_id=${jobId || 'NONE'}`);

  if (jobId) {
    const bidListResponse = await request('bid_list', `/api/bids/job/${jobId}?limit=100000`, {
      headers: authHeaders,
      timeoutMs: 60000,
    });
    const effectiveLimit = bidListResponse.json?.data?.pagination?.limit
      || bidListResponse.json?.meta?.pagination?.limit
      || bidListResponse.json?.pagination?.limit
      || 'UNKNOWN';
    console.log(`bid_list_effective_limit=${effectiveLimit}`);
  }

  const changeForward = await request('change_password_forward', '/api/auth/change-password', {
    method: 'POST',
    headers: authHeaders,
    body: {
      currentPassword,
      newPassword: temporaryPassword,
    },
    timeoutMs: 60000,
  });

  if (changeForward.status === 200) {
    const tempLoginResponse = await request('temp_login', '/api/auth/login', {
      method: 'POST',
      body: { email, password: temporaryPassword },
      timeoutMs: 60000,
    });
    const tempToken = extractToken(tempLoginResponse.json);
    console.log(`temp_login_token_present=${tempToken ? 'yes' : 'no'}`);

    if (tempToken) {
      await request('change_password_revert', '/api/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tempToken}` },
        body: {
          currentPassword: temporaryPassword,
          newPassword: currentPassword,
        },
        timeoutMs: 60000,
      });
    }
  }
}

main().catch((error) => {
  console.error('smoke_fatal=' + sanitize(error.message));
  process.exitCode = 1;
});
