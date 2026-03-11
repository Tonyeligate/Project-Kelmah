const PaystackService = require('../integrations/paystack');
const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const AirtelTigoService = require('../integrations/airteltigo');

const parseArgs = (argv) => ({
  runHealthChecks: argv.includes('--health'),
  runSmokeChecks: argv.includes('--smoke'),
  smokeConfirmed: process.env.ENABLE_REFUND_SMOKE_CHECKS === 'true',
});

const getMissingEnv = (names = []) => names.filter((name) => !process.env[name]);

const timestampedExternalId = (prefix) => `${prefix}_${Date.now()}`;

const PROVIDERS = [
  {
    name: 'paystack',
    service: () => new PaystackService(),
    refundMode: 'provider_refund',
    requiredEnv: ['PAYSTACK_SECRET_KEY'],
    smokeEnv: ['PAYSTACK_SECRET_KEY', 'PAYSTACK_SMOKE_REFUND_REFERENCE'],
    healthCheck: (client) => client.healthCheck(),
    smokeCheck: async (client) => client.refundPayment(
      process.env.PAYSTACK_SMOKE_REFUND_REFERENCE,
      {
        amount: process.env.PAYSTACK_SMOKE_REFUND_AMOUNT,
        currency: process.env.PAYSTACK_SMOKE_REFUND_CURRENCY || 'GHS',
        reason: process.env.PAYSTACK_SMOKE_REFUND_REASON || 'Kelmah sandbox smoke refund',
      },
    ),
  },
  {
    name: 'mtn_momo',
    service: () => new MTNMoMoService(),
    refundMode: 'return_transfer',
    requiredEnv: ['MTN_SUBSCRIPTION_KEY', 'MTN_COLLECTION_API_USER_ID', 'MTN_COLLECTION_PRIMARY_KEY'],
    smokeEnv: ['MTN_SUBSCRIPTION_KEY', 'MTN_DISBURSEMENT_API_USER_ID', 'MTN_DISBURSEMENT_PRIMARY_KEY', 'MTN_SMOKE_REFUND_PHONE_NUMBER', 'MTN_SMOKE_REFUND_AMOUNT'],
    healthCheck: (client) => client.healthCheck(),
    smokeCheck: async (client) => client.refundPayment({
      amount: process.env.MTN_SMOKE_REFUND_AMOUNT,
      phoneNumber: process.env.MTN_SMOKE_REFUND_PHONE_NUMBER,
      externalId: timestampedExternalId('MTN_SMOKE_REFUND'),
      payerMessage: 'Kelmah smoke refund',
      payeeNote: process.env.MTN_SMOKE_REFUND_NOTE || 'Kelmah sandbox smoke refund',
      originalReferenceId: process.env.MTN_SMOKE_ORIGINAL_REFERENCE_ID,
    }),
  },
  {
    name: 'vodafone_cash',
    service: () => new VodafoneCashService(),
    refundMode: 'provider_refund',
    requiredEnv: ['VODAFONE_CLIENT_ID', 'VODAFONE_CLIENT_SECRET', 'VODAFONE_MERCHANT_ID'],
    smokeEnv: ['VODAFONE_CLIENT_ID', 'VODAFONE_CLIENT_SECRET', 'VODAFONE_MERCHANT_ID', 'VODAFONE_SMOKE_PAYMENT_ID'],
    healthCheck: (client) => client.healthCheck(),
    smokeCheck: async (client) => client.refundPayment(
      process.env.VODAFONE_SMOKE_PAYMENT_ID,
      {
        amount: process.env.VODAFONE_SMOKE_REFUND_AMOUNT,
        reason: process.env.VODAFONE_SMOKE_REFUND_REASON || 'Kelmah sandbox smoke refund',
      },
    ),
  },
  {
    name: 'airtel_tigo',
    service: () => new AirtelTigoService(),
    refundMode: 'return_transfer',
    requiredEnv: ['AIRTELTIGO_CLIENT_ID', 'AIRTELTIGO_CLIENT_SECRET', 'AIRTELTIGO_MERCHANT_ID'],
    smokeEnv: ['AIRTELTIGO_CLIENT_ID', 'AIRTELTIGO_CLIENT_SECRET', 'AIRTELTIGO_MERCHANT_ID', 'AIRTELTIGO_SMOKE_REFUND_PHONE_NUMBER', 'AIRTELTIGO_SMOKE_REFUND_AMOUNT'],
    healthCheck: (client) => client.healthCheck(),
    smokeCheck: async (client) => client.refundPayment({
      amount: process.env.AIRTELTIGO_SMOKE_REFUND_AMOUNT,
      phoneNumber: process.env.AIRTELTIGO_SMOKE_REFUND_PHONE_NUMBER,
      externalId: timestampedExternalId('AIRTEL_SMOKE_REFUND'),
      description: process.env.AIRTELTIGO_SMOKE_REFUND_NOTE || 'Kelmah sandbox smoke refund',
      originalReferenceId: process.env.AIRTELTIGO_SMOKE_ORIGINAL_REFERENCE_ID,
    }),
  },
];

const summarizeProvider = async ({ name, service, refundMode, healthCheck, smokeCheck, requiredEnv = [], smokeEnv = [] }, options) => {
  const client = service();
  const supportsRefund = typeof client.refundPayment === 'function';
  const missingRequiredEnv = getMissingEnv(requiredEnv);
  const missingSmokeEnv = getMissingEnv(smokeEnv);
  const summary = {
    provider: name,
    refundMode,
    supportsRefund,
    configured: missingRequiredEnv.length === 0,
    missingRequiredEnv,
    health: 'skipped',
    smoke: 'skipped',
  };

  if (!supportsRefund) {
    summary.health = 'missing_refund_method';
    summary.smoke = 'missing_refund_method';
    return summary;
  }

  if (options.runHealthChecks) {
    if (missingRequiredEnv.length > 0) {
      summary.health = 'skipped_missing_env';
    } else {
      try {
        const result = await healthCheck(client);
        summary.health = result?.status || (result?.success ? 'healthy' : 'unhealthy');
        if (!result?.success && result?.error) {
          summary.healthError = result.error;
        }
      } catch (error) {
        summary.health = 'error';
        summary.healthError = error.message;
      }
    }
  }

  if (options.runSmokeChecks) {
    summary.smokeConfirmed = options.smokeConfirmed;
    if (!options.smokeConfirmed) {
      summary.smoke = 'skipped_confirmation_required';
    } else if (typeof smokeCheck !== 'function') {
      summary.smoke = 'skipped_not_supported';
    } else if (missingSmokeEnv.length > 0) {
      summary.smoke = 'skipped_missing_env';
      summary.missingSmokeEnv = missingSmokeEnv;
    } else {
      try {
        const result = await smokeCheck(client);
        summary.smoke = result?.success === false ? 'failed' : 'passed';
        summary.smokeResult = result?.data || result || null;
        if (result?.success === false && result?.error) {
          summary.smokeError = result.error;
        }
      } catch (error) {
        summary.smoke = 'error';
        summary.smokeError = error.message;
      }
    }
  }

  return summary;
};

const main = async () => {
  const options = parseArgs(process.argv);
  const summaries = [];
  for (const provider of PROVIDERS) {
    summaries.push(await summarizeProvider(provider, options));
  }

  const payload = {
    success: summaries.every((item) => item.supportsRefund),
    healthChecksRun: options.runHealthChecks,
    smokeChecksRun: options.runSmokeChecks,
    smokeConfirmationRequired: options.runSmokeChecks && !options.smokeConfirmed,
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