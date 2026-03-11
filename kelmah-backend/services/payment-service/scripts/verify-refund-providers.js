const PaystackService = require('../integrations/paystack');
const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const AirtelTigoService = require('../integrations/airteltigo');

const PROVIDERS = [
  {
    name: 'paystack',
    service: () => new PaystackService(),
    refundMode: 'provider_refund',
    healthCheck: (client) => client.healthCheck(),
  },
  {
    name: 'mtn_momo',
    service: () => new MTNMoMoService(),
    refundMode: 'return_transfer',
    healthCheck: (client) => client.healthCheck(),
  },
  {
    name: 'vodafone_cash',
    service: () => new VodafoneCashService(),
    refundMode: 'provider_refund',
    healthCheck: (client) => client.healthCheck(),
  },
  {
    name: 'airtel_tigo',
    service: () => new AirtelTigoService(),
    refundMode: 'return_transfer',
    healthCheck: (client) => client.healthCheck(),
  },
];

const shouldRunHealthChecks = process.argv.includes('--health');

const summarizeProvider = async ({ name, service, refundMode, healthCheck }) => {
  const client = service();
  const supportsRefund = typeof client.refundPayment === 'function';
  const summary = {
    provider: name,
    refundMode,
    supportsRefund,
    health: 'skipped',
  };

  if (!supportsRefund) {
    summary.health = 'missing_refund_method';
    return summary;
  }

  if (!shouldRunHealthChecks) {
    return summary;
  }

  try {
    const result = await healthCheck(client);
    summary.health = result?.status || (result?.success ? 'healthy' : 'unhealthy');
    if (!result?.success && result?.error) {
      summary.error = result.error;
    }
  } catch (error) {
    summary.health = 'error';
    summary.error = error.message;
  }

  return summary;
};

const main = async () => {
  const summaries = [];
  for (const provider of PROVIDERS) {
    summaries.push(await summarizeProvider(provider));
  }

  const payload = {
    success: summaries.every((item) => item.supportsRefund),
    healthChecksRun: shouldRunHealthChecks,
    providers: summaries,
  };

  console.log(JSON.stringify(payload, null, 2));

  if (!payload.success) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
  process.exitCode = 1;
});