#!/usr/bin/env node

const path = require("path");
const mongoose = require("mongoose");
const dotenvPath = process.env.MESSAGING_SERVICE_DOTENV || path.resolve(__dirname, "..", "..", "..", "..", ".env");

try {
  require("dotenv").config({ path: dotenvPath, override: false });
} catch (err) {
  console.warn("[virus-scan-backfill] Unable to load dotenv file:", err.message);
}

const Message = require("../models/Message");
const { ensureAttachmentScanState } = require("../utils/virusScanState");

const BATCH_LOG_INTERVAL = Number(process.env.VIRUS_SCAN_BACKFILL_LOG_INTERVAL || 100);

async function normalizeMessageAttachments(message) {
  if (!Array.isArray(message.attachments) || message.attachments.length === 0) {
    return false;
  }

  let changed = false;
  const normalizedAttachments = message.attachments.map((attachmentSubdoc) => {
    const rawAttachment =
      typeof attachmentSubdoc?.toObject === "function"
        ? attachmentSubdoc.toObject()
        : { ...attachmentSubdoc };
    const before = JSON.stringify(rawAttachment.virusScan || null);
    const normalized = ensureAttachmentScanState({ ...rawAttachment });
    const after = JSON.stringify(normalized.virusScan || null);
    if (before !== after) changed = true;
    return normalized;
  });

  if (changed) {
    message.attachments = normalizedAttachments;
    await message.save();
  }

  return changed;
}

async function run() {
  const uri =
    process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

  if (!uri) {
    console.error(
      "[virus-scan-backfill] Missing MONGODB_URI / DATABASE_URL for messaging service",
    );
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("[virus-scan-backfill] Connected to MongoDB");

  const cursor = Message.find({
    "attachments.0": { $exists: true },
    $or: [
      { "attachments.virusScan": { $exists: false } },
      { "attachments.virusScan.metadata": { $exists: false } },
      { "attachments.virusScan.statusHistory": { $exists: false } },
    ],
  })
    .sort({ updatedAt: -1 })
    .cursor();

  let processed = 0;
  let updated = 0;

  for await (const message of cursor) {
    processed += 1;
    const changed = await normalizeMessageAttachments(message);
    if (changed) updated += 1;

    if (processed % BATCH_LOG_INTERVAL === 0) {
      console.log(
        `[virus-scan-backfill] Processed ${processed} messages (${updated} updated)`,
      );
    }
  }

  console.log(
    `[virus-scan-backfill] Complete. ${processed} messages scanned, ${updated} updated.`,
  );
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("[virus-scan-backfill] Fatal error:", error);
  process.exit(1);
});
