// Lightweight OpenTelemetry initializer with safe fallbacks
// Activates only when ENABLE_OTEL=true and modules are available

function initTracing(serviceName) {
  try {
    if ((process.env.ENABLE_OTEL || '').toLowerCase() !== 'true') {
      return { enabled: false };
    }
    // Lazy-require to avoid hard deps
    // eslint-disable-next-line global-require
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    // eslint-disable-next-line global-require
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    // eslint-disable-next-line global-require
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS || undefined,
    });
    const sdk = new NodeSDK({
      resource: undefined,
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
    // Mark service name env for exporters
    process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || serviceName;
    return { enabled: true, sdk };
  } catch (err) {
    // Missing deps or disabled
    if (process.env.DEBUG_OTEL === 'true') {
      // eslint-disable-next-line no-console
      console.warn(`[otel] tracing disabled for ${serviceName}:`, err?.message);
    }
    return { enabled: false };
  }
}

module.exports = { initTracing };


