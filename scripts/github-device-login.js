#!/usr/bin/env node
/**
 * GitHub Device Flow Login
 * ─────────────────────────────────────────────────────────────────────────────
 * Authenticates a GitHub account via browser device flow and saves the token
 * directly into git's credential store (per-username) so multiple accounts
 * can coexist.  No gh CLI required.
 *
 * Usage:
 *   node scripts/github-device-login.js [--username Tonyeligate]
 *
 * After running for each account, update your remote URL to embed the username:
 *   git remote set-url origin https://Tonyeligate@github.com/Tonyeligate/Project-Kelmah.git
 *
 * That tells git exactly which stored credential to use on every push.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// ─── GitHub OAuth App client_id ──────────────────────────────────────────────
// Uses GitHub CLI's public client_id (well-known, no secret needed).
const CLIENT_ID = '178c6fc778ccc68e1d6a';
const SCOPES    = 'repo,gist,read:org,workflow';

// ─── helpers ─────────────────────────────────────────────────────────────────
function post(hostname, path, body, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const data = body;
    const req  = https.request(
      { hostname, path, method: 'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
          Accept:          'application/json'
        },
        timeout: timeoutMs
      },
      res => {
        let raw = '';
        res.on('data', c => (raw += c));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { resolve(raw); }
        });
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('ETIMEDOUT')); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function postWithRetry(hostname, path, body, maxRetries = 5, timeoutMs = 15000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await post(hostname, path, body, timeoutMs);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(3000);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function openBrowser(url) {
  try { execSync(`start "" "${url}"`, { stdio: 'ignore' }); }
  catch { /* ignore – user can open manually */ }
}

// Store credential in git's credential store (works with any helper: wincred, GCM, etc.)
function storeCredential(username, token) {
  const input = [
    'protocol=https',
    'host=github.com',
    `username=${username}`,
    `password=${token}`,
    ''
  ].join('\n');

  const result = spawnSync('git', ['credential', 'approve'], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'git credential approve failed');
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  // Optional --username hint (for display only; actual username confirmed from API)
  const args      = process.argv.slice(2);
  const usernameHint = args[args.indexOf('--username') + 1] || '';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GitHub Device Flow Login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1 — request device + user code
  console.log('⏳  Requesting device code from GitHub…');
  const codeResp = await postWithRetry(
    'github.com',
    '/login/device/code',
    `client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}`
  );

  if (codeResp.error) {
    console.error('✗  Error from GitHub:', codeResp.error_description || codeResp.error);
    process.exit(1);
  }

  const { device_code, user_code, verification_uri, expires_in, interval = 5 } = codeResp;
  const deviceUrl = verification_uri || 'https://github.com/login/device';

  // Step 2 — show the code + open browser
  console.log('┌─────────────────────────────────────────────────┐');
  console.log(`│  Your one-time code:  ${user_code.padEnd(27)}│`);
  console.log(`│  Open:  ${deviceUrl.padEnd(42)}│`);
  console.log('└─────────────────────────────────────────────────┘\n');
  console.log('Opening browser… If it does not open, visit the URL above and enter the code.\n');

  // Open the "select account" page so user can choose which GitHub account to authorise
  openBrowser(`${deviceUrl}/select_account`);

  // Step 3 — poll for token
  console.log('⏳  Waiting for you to authorise in the browser…');
  const deadline = Date.now() + expires_in * 1000;
  let token = null;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);
    process.stdout.write('.');

    let poll;
    try {
      poll = await postWithRetry(
        'github.com',
        '/login/oauth/access_token',
        `client_id=${CLIENT_ID}&device_code=${device_code}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
      );
    } catch (e) { process.stdout.write('t'); continue; } // network hiccup, keep trying

    if (poll.access_token) {
      token = poll.access_token;
      break;
    }

    if (poll.error === 'authorization_pending') continue;     // still waiting
    if (poll.error === 'slow_down')            { await sleep(5000); continue; }
    if (poll.error === 'expired_token')        { console.log('\n✗  Code expired. Re-run the script.'); process.exit(1); }
    if (poll.error === 'access_denied')        { console.log('\n✗  Access denied by user.'); process.exit(1); }

    console.log('\n✗  Unexpected error:', poll.error, poll.error_description);
    process.exit(1);
  }

  if (!token) { console.log('\n✗  Timed out waiting for authorisation.'); process.exit(1); }
  console.log('\n');

  // Step 4 — fetch actual username from token
  let username = usernameHint || 'unknown';
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      username = await new Promise((resolve, reject) => {
        const req = https.request(
          { hostname: 'api.github.com', path: '/user', method: 'GET',
            headers: { Authorization: `token ${token}`, 'User-Agent': 'kelmah-device-login' },
            timeout: 15000
          },
          res => {
            let raw = ''; res.on('data', c => (raw += c)); res.on('end', () => {
              try { resolve(JSON.parse(raw).login); } catch { resolve(usernameHint || 'unknown'); }
            });
          }
        );
        req.on('timeout', () => { req.destroy(); reject(new Error('ETIMEDOUT')); });
        req.on('error', reject);
        req.end();
      });
      break;
    } catch (e) {
      if (attempt === 4) { console.log('  (Could not fetch username, using hint)'); }
      else { await sleep(3000); }
    }
  }

  console.log(`✔  Authorised as: ${username}`);

  // Step 5 — store in git credential manager
  storeCredential(username, token);
  console.log(`✔  Token saved to git credential store for ${username}\n`);

  // Step 6 — suggest remote URL update for this repo
  console.log('─────────────────────────────────────────────────────────');
  console.log('  Next steps to assign this account to this repo:');
  console.log('');
  console.log(`  git remote set-url origin https://${username}@github.com/Tonyeligate/Project-Kelmah.git`);
  console.log('');
  console.log('  git push');
  console.log('─────────────────────────────────────────────────────────');
  console.log('');
  console.log('  To add a SECOND account (e.g. Giftyafisa), run:');
  console.log('    node scripts/github-device-login.js --username Giftyafisa');
  console.log('  Then switch between accounts by updating the remote URL username.');
  console.log('─────────────────────────────────────────────────────────\n');
})();
