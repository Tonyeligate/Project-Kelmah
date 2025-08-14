// Lightweight OpenTelemetry initializer with safe fallbacks
function initTracing(serviceName) {
  try {
    if ((process.env.ENABLE_OTEL || '').toLowerCase() !== 'true') {
      return { enabled: false };
    }
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
    });
    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
    return { enabled: true, sdk };
  } catch (err) {
    return { enabled: false };
  }
}

module.exports = { initTracing };






