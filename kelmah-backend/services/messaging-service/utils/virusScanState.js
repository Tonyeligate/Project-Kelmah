const isDefined = (value) => value !== undefined && value !== null && value !== "";

const buildMetadataFromAttachment = (attachment = {}) => {
  const metadata = {
    filename: attachment.fileName || attachment.name,
    originalName: attachment.originalname,
    mimeType: attachment.mimeType || attachment.type || attachment.fileType,
    size: attachment.size || attachment.fileSize,
    url: attachment.url || attachment.fileUrl,
    s3Key: attachment.s3Key,
    bucket: attachment.bucket,
    extension: attachment.extension,
    storage: attachment.storage,
  };
  return Object.entries(metadata).reduce((acc, [key, value]) => {
    if (isDefined(value)) acc[key] = value;
    return acc;
  }, {});
};

const ensureAttachmentScanState = (attachment = {}) => {
  if (!attachment || typeof attachment !== "object") {
    return attachment;
  }
  const existing = attachment.virusScan || {};
  const baseMetadata = buildMetadataFromAttachment(attachment);
  attachment.virusScan = {
    status: existing.status || "pending",
    scannedAt: existing.scannedAt || null,
    engine: existing.engine || null,
    details: existing.details || null,
    vendor: existing.vendor || null,
    simulated:
      typeof existing.simulated === "boolean" ? existing.simulated : undefined,
    reason: existing.reason || null,
    metadata: {
      ...baseMetadata,
      ...(existing.metadata || {}),
    },
    statusHistory: Array.isArray(existing.statusHistory)
      ? existing.statusHistory
      : [],
  };
  return attachment;
};

const ensureAttachmentScanStateList = (attachments) => {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((attachment) =>
    ensureAttachmentScanState({ ...(attachment || {}) }),
  );
};

const coerceDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const mergeScanResult = (attachment, scanResult = {}) => {
  if (!attachment) return attachment;
  ensureAttachmentScanState(attachment);
  const now = new Date();
  const status = scanResult.status || attachment.virusScan.status || "pending";
  const scannedAt = coerceDate(
    scanResult.metadata?.scannedAt || scanResult.scannedAt || now,
  );
  attachment.virusScan = {
    ...attachment.virusScan,
    status,
    scannedAt,
    engine: scanResult.engine || attachment.virusScan.engine,
    details: scanResult.details || attachment.virusScan.details,
    vendor: scanResult.vendor || attachment.virusScan.vendor,
    simulated:
      typeof scanResult.simulated === "boolean"
        ? scanResult.simulated
        : attachment.virusScan.simulated,
    reason: scanResult.reason || attachment.virusScan.reason,
    metadata: {
      ...attachment.virusScan.metadata,
      ...(scanResult.metadata || {}),
    },
    statusHistory: [
      ...(attachment.virusScan.statusHistory || []),
      {
        status,
        timestamp: now,
        engine: scanResult.engine || attachment.virusScan.engine,
        details: scanResult.details || attachment.virusScan.details,
      },
    ].slice(-25),
  };
  return attachment;
};

module.exports = {
  ensureAttachmentScanState,
  ensureAttachmentScanStateList,
  mergeScanResult,
};
