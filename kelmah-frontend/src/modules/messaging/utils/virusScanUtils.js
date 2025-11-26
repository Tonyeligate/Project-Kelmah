import {
  CheckCircle,
  HourglassEmpty,
  ReportProblem,
  Info,
} from '@mui/icons-material';

export const normalizeAttachmentVirusScan = (attachment = {}) => {
  const existing = attachment.virusScan || {};
  return {
    ...attachment,
    virusScan: {
      status: existing.status || 'pending',
      details: existing.details || existing.message || 'Awaiting virus scan',
      engine: existing.engine || null,
      vendor: existing.vendor || null,
      scannedAt: existing.scannedAt || null,
      reason: existing.reason || null,
      metadata: {
        filename:
          attachment.fileName ||
          attachment.filename ||
          attachment.name ||
          existing.metadata?.filename,
        mimeType:
          attachment.mimeType ||
          attachment.fileType ||
          attachment.type ||
          existing.metadata?.mimeType,
        size: attachment.size || attachment.fileSize || existing.metadata?.size,
        s3Key: attachment.s3Key || existing.metadata?.s3Key,
      },
      statusHistory: existing.statusHistory || [],
      simulated: existing.simulated,
    },
  };
};

export const normalizeAttachmentListVirusScan = (attachments = []) =>
  attachments.map((attachment) =>
    normalizeAttachmentVirusScan(attachment || {}),
  );

export const getVirusScanDisplay = (virusScan = {}) => {
  const status = virusScan.status || 'pending';
  switch (status) {
    case 'clean':
      return {
        label: 'Scanned',
        color: 'success',
        icon: CheckCircle,
        tooltip: virusScan.details || 'Attachment cleared by virus scanner',
        allowDownload: true,
      };
    case 'infected':
      return {
        label: 'Blocked',
        color: 'error',
        icon: ReportProblem,
        tooltip:
          virusScan.details ||
          'Attachment flagged as infected. Download disabled.',
        allowDownload: false,
      };
    case 'failed':
      return {
        label: 'Scan failed',
        color: 'warning',
        icon: ReportProblem,
        tooltip:
          virusScan.details || 'Scanner could not complete. Retry later.',
        allowDownload: false,
      };
    case 'pending':
      return {
        label: 'Scanning…',
        color: 'warning',
        icon: HourglassEmpty,
        tooltip: virusScan.details || 'Attachment queued for virus scan',
        allowDownload: false,
      };
    case 'skipped':
      return {
        label: 'Not scanned',
        color: 'default',
        icon: Info,
        tooltip: virusScan.details || 'Virus scan skipped by configuration',
        allowDownload: true,
      };
    default:
      return {
        label: status,
        color: 'default',
        icon: Info,
        tooltip: virusScan.details || 'Virus scan status unavailable',
        allowDownload: false,
      };
  }
};
