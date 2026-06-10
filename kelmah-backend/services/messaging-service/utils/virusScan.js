// Configurable virus scan helpers.
// Supports CLAMD (TCP), HTTP-based scanners, or a safe stub fallback.

const crypto = require("crypto");
const net = require("net");
const path = require("path");
const { URL } = require("url");

const SUPPORTED_STRATEGIES = new Set(["clamav", "http", "stub"]);
const DEFAULT_TIMEOUT = Number(process.env.VIRUS_SCAN_TIMEOUT_MS || 8000);
const DEFAULT_MAX_BASE64_BYTES = Number(
  process.env.VIRUS_SCAN_HTTP_MAX_BASE64_BYTES || 5 * 1024 * 1024,
);

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseHeaders = () => {
  const raw = process.env.VIRUS_SCAN_HTTP_EXTRA_HEADERS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_) {
    // fallthrough to key=value parsing
  }
  return raw.split(",").reduce((acc, entry) => {
    const [key, ...rest] = entry.split("=");
    if (!key || rest.length === 0) return acc;
    acc[key.trim()] = rest.join("=").trim();
    return acc;
  }, {});
};

const resolveConfig = () => {
  const rawStrategy = (process.env.VIRUS_SCAN_STRATEGY || "stub").toLowerCase();
  const strategy = SUPPORTED_STRATEGIES.has(rawStrategy)
    ? rawStrategy
    : "stub";
  return {
    strategy,
    timeout: DEFAULT_TIMEOUT,
    clamav: {
      host: process.env.CLAMAV_HOST || "127.0.0.1",
      port: toNumber(process.env.CLAMAV_PORT, 3310),
    },
    http: {
      endpoint: process.env.VIRUS_SCAN_HTTP_ENDPOINT,
      apiKeyHeader:
        process.env.VIRUS_SCAN_HTTP_HEADER || process.env.VIRUS_SCAN_HTTP_API_KEY_HEADER,
      apiKey: process.env.VIRUS_SCAN_HTTP_KEY || process.env.VIRUS_SCAN_HTTP_API_KEY,
      sendBase64:
        (process.env.VIRUS_SCAN_HTTP_SEND_BASE64 || "true").toLowerCase() ===
        "true",
      maxBase64Bytes: DEFAULT_MAX_BASE64_BYTES,
      extraHeaders: parseHeaders(),
    },
  };
};

const buildMetadata = (buffer, filename, overrides = {}) => {
  const metadata = {
    filename: filename || overrides.filename || "unknown",
    extension: path.extname(filename || "").replace(/^\./, "") || undefined,
    size: buffer ? buffer.length : undefined,
    sha256: buffer
      ? crypto.createHash("sha256").update(buffer).digest("hex")
      : undefined,
    source: overrides.source || "buffer",
    mimeType: overrides.mimeType,
    s3Key: overrides.s3Key,
    bucket: overrides.bucket,
    scannedAt: new Date().toISOString(),
  };
  return { ...metadata, ...overrides };
};

const normalizeResult = (status, engine, details, metadata, extra = {}) => ({
  status,
  engine,
  details,
  metadata,
  ...extra,
});

const scanWithClamAV = (buffer, config) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(
      { host: config.host, port: config.port, timeout: config.timeout },
      () => client.write("nINSTREAM\n"),
    );

    client.on("error", (err) => {
      client.destroy();
      reject(err);
    });

    client.on("timeout", () => {
      client.destroy();
      reject(new Error("ClamAV scan timed out"));
    });

    const chunkSize = 64 * 1024;
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      const chunk = buffer.subarray(offset, offset + chunkSize);
      const len = Buffer.alloc(4);
      len.writeUInt32BE(chunk.length, 0);
      client.write(len);
      client.write(chunk);
    }
    const terminator = Buffer.alloc(4);
    terminator.writeUInt32BE(0, 0);
    client.write(terminator);

    let response = "";
    client.on("data", (data) => {
      response += data.toString();
    });

    client.on("close", () => {
      if (!response) {
        reject(new Error("ClamAV returned empty response"));
        return;
      }
      const normalized = response.trim();
      if (normalized.includes("FOUND")) {
        resolve({ status: "infected", details: normalized });
      } else if (normalized.includes("OK")) {
        resolve({ status: "clean", details: normalized });
      } else {
        resolve({ status: "unknown", details: normalized });
      }
    });
  });
};

const scanViaHttp = async (buffer, metadata, config, payloadOverrides = {}) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this runtime");
  }
  if (!config.http.endpoint) {
    throw new Error("VIRUS_SCAN_HTTP_ENDPOINT is not configured");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeout);
  try {
    const body = {
      filename: metadata.filename,
      size: metadata.size,
      sha256: metadata.sha256,
      metadata,
      ...payloadOverrides,
    };
    if (
      buffer &&
      config.http.sendBase64 &&
      buffer.length <= config.http.maxBase64Bytes
    ) {
      body.content = buffer.toString("base64");
    }
    const headers = {
      "Content-Type": "application/json",
      ...config.http.extraHeaders,
    };
    if (config.http.apiKey && config.http.apiKeyHeader) {
      headers[config.http.apiKeyHeader] = config.http.apiKey;
    }
    const response = await fetch(config.http.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      parsed = undefined;
    }
    const status = parsed?.status || (response.ok ? "clean" : "failed");
    return {
      status,
      engine: parsed?.engine || "http",
      details: parsed?.details || parsed?.message || text || "No response body",
      vendor: parsed?.vendor,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const downloadS3Object = async (bucket, key, region) => {
  if (!bucket || !key) {
    throw new Error("Bucket and key are required to download S3 object");
  }
  const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
  const client = new S3Client({
    region: region || process.env.AWS_REGION,
    credentials: undefined,
  });
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const chunks = [];
  for await (const chunk of result.Body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const buildEngineLabel = (config) => {
  if (config.strategy === "clamav") {
    return `clamav@${config.clamav.host}:${config.clamav.port}`;
  }
  if (config.strategy === "http") {
    try {
      const url = new URL(config.http.endpoint);
      return `http:${url.host}`;
    } catch (_) {
      return "http";
    }
  }
  return "stub";
};

exports.scanBuffer = async (buffer, filename, options = {}) => {
  const config = resolveConfig();
  const metadata = buildMetadata(buffer, filename, {
    mimeType: options.mimeType,
    source: options.source || "buffer",
    s3Key: options.s3Key,
    bucket: options.bucket,
  });
  const engine = buildEngineLabel(config);
  if (!buffer || buffer.length === 0) {
    return normalizeResult(
      "skipped",
      engine,
      "No buffer supplied for scanning",
      metadata,
      { reason: "empty_buffer" },
    );
  }

  try {
    if (config.strategy === "clamav") {
      const verdict = await scanWithClamAV(buffer, {
        ...config.clamav,
        timeout: config.timeout,
      });
      return normalizeResult(verdict.status, engine, verdict.details, metadata);
    }
    if (config.strategy === "http") {
      const verdict = await scanViaHttp(buffer, metadata, config);
      return normalizeResult(verdict.status, verdict.engine, verdict.details, metadata, {
        vendor: verdict.vendor,
      });
    }
    return normalizeResult(
      "clean",
      engine,
      "Scanner strategy set to stub; returning clean",
      metadata,
      { simulated: true },
    );
  } catch (error) {
    return normalizeResult(
      "failed",
      engine,
      error.message,
      metadata,
      { reason: "scanner_error" },
    );
  }
};

const normalizeS3Input = (input, options = {}) => {
  if (!input) return { key: undefined };
  if (typeof input === "string") {
    return { key: input, ...options };
  }
  if (typeof input === "object") {
    return { ...input, ...options };
  }
  return { key: undefined };
};

exports.scanS3Object = async (input, options = {}) => {
  const config = resolveConfig();
  const descriptor = normalizeS3Input(input, options);
  const metadata = buildMetadata(null, descriptor.filename, {
    source: "s3",
    s3Key: descriptor.key || descriptor.s3Key,
    bucket: descriptor.bucket || process.env.S3_BUCKET,
    mimeType: descriptor.contentType,
  });
  const engine = buildEngineLabel(config);

  if (!metadata.s3Key) {
    return normalizeResult(
      "pending",
      engine,
      "S3 key not provided",
      metadata,
      { reason: "missing_key" },
    );
  }

  try {
    if (config.strategy === "clamav") {
      if ((process.env.ENABLE_S3_STREAM_SCAN || "false") === "true") {
        const buffer = await downloadS3Object(
          metadata.bucket,
          metadata.s3Key,
          descriptor.region,
        );
        return exports.scanBuffer(buffer, descriptor.filename || metadata.s3Key, {
          mimeType: metadata.mimeType,
          source: "s3",
          s3Key: metadata.s3Key,
          bucket: metadata.bucket,
        });
      }
      return normalizeResult(
        "pending",
        engine,
        "S3 stream scan disabled",
        metadata,
        { reason: "stream_disabled" },
      );
    }
    if (config.strategy === "http") {
      const verdict = await scanViaHttp(null, metadata, config, {
        s3Key: metadata.s3Key,
        bucket: metadata.bucket,
        versionId: descriptor.versionId,
      });
      return normalizeResult(verdict.status, verdict.engine, verdict.details, metadata, {
        vendor: verdict.vendor,
      });
    }
    return normalizeResult(
      "pending",
      engine,
      "Scanner strategy set to stub; marking as pending",
      metadata,
      { simulated: true },
    );
  } catch (error) {
    return normalizeResult(
      "failed",
      engine,
      error.message,
      metadata,
      { reason: "scanner_error" },
    );
  }
};
