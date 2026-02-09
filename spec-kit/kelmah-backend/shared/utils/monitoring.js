// Sentry bootstrap and OTel exporter wiring
function initErrorMonitoring(serviceName) {
  try {
    if ((process.env.ENABLE_SENTRY || '').toLowerCase() !== 'true') {
      return { enabled: false };
    }
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
      release: process.env.APP_VERSION,
      serverName: serviceName,
    });
    return { enabled: true, Sentry };
  } catch (err) {
    if (process.env.DEBUG_SENTRY === 'true') {
      // eslint-disable-next-line no-console
      console.warn(`[sentry] disabled for ${serviceName}:`, err?.message);
    }
    return { enabled: false };
  }
}

function initTracing(serviceName) {
  try {
    if ((process.env.ENABLE_OTEL || '').toLowerCase() !== 'true') {
      return { enabled: false };
    }
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const exporter = new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT });
    const sdk = new NodeSDK({
      traceExporter: exporter,
      serviceName,
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
    return { enabled: true };
  } catch (err) {
    if (process.env.DEBUG_OTEL === 'true') {
      // eslint-disable-next-line no-console
      console.warn(`[otel] disabled for ${serviceName}:`, err?.message);
    }
    return { enabled: false };
  }
}

module.exports = { initErrorMonitoring, initTracing };


