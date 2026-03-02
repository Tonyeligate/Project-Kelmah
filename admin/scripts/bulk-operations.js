/**
 * Admin Bulk Operations Script
 *
 * Run admin bulk operations directly from the command line.
 * Usage:
 *   node admin/scripts/bulk-operations.js <action> [options]
 *
 * Actions:
 *   bulk-update   --ids <comma-separated-ids> --data <JSON>
 *   bulk-delete   --ids <comma-separated-ids>
 *   system-stats  (no options)
 *
 * Examples:
 *   node admin/scripts/bulk-operations.js system-stats
 *   node admin/scripts/bulk-operations.js bulk-update --ids id1,id2 --data '{"isActive":false}'
 *   node admin/scripts/bulk-operations.js bulk-delete --ids id1,id2
 */

const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('ERROR: Set ADMIN_TOKEN env var with a valid admin JWT');
  process.exit(1);
}

const api = axios.create({
  baseURL: `${GATEWAY_URL}/api`,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

async function systemStats() {
  const { data } = await api.get('/users/analytics/platform');
  console.log('Platform Analytics:', JSON.stringify(data, null, 2));
}

async function bulkUpdate(ids, updateData) {
  const { data } = await api.put('/users/bulk-update', {
    userIds: ids,
    updateData,
  });
  console.log('Bulk Update Result:', JSON.stringify(data, null, 2));
}

async function bulkDelete(ids) {
  const { data } = await api.delete('/users/bulk-delete', {
    data: { userIds: ids },
  });
  console.log('Bulk Delete Result:', JSON.stringify(data, null, 2));
}

// CLI argument parsing
const args = process.argv.slice(2);
const action = args[0];

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

(async () => {
  try {
    switch (action) {
      case 'system-stats':
        await systemStats();
        break;

      case 'bulk-update': {
        const idsRaw = getFlag('--ids');
        const dataRaw = getFlag('--data');
        if (!idsRaw || !dataRaw) {
          console.error('Usage: bulk-update --ids id1,id2 --data \'{"isActive":false}\'');
          process.exit(1);
        }
        await bulkUpdate(idsRaw.split(','), JSON.parse(dataRaw));
        break;
      }

      case 'bulk-delete': {
        const idsRaw = getFlag('--ids');
        if (!idsRaw) {
          console.error('Usage: bulk-delete --ids id1,id2');
          process.exit(1);
        }
        await bulkDelete(idsRaw.split(','));
        break;
      }

      default:
        console.error(`Unknown action: ${action}`);
        console.error('Available actions: system-stats, bulk-update, bulk-delete');
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
