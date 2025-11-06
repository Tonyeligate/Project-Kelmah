#!/usr/bin/env node
/**
 * Jobs Data Cleaner
 * Validates and normalizes job documents to match frontend expectations.
 * - Fixes types and safe defaults
 * - Repairs obviously wrong dates/values when possible
 * - Removes fatally invalid records (unrecoverable)
 * - Ensures lookups alignment (categories, locations)
 * - Summarizes actions
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, mongoose } = require('../config/db');

// Simple lookup sets (expand as needed or source from DB)
const TRADE_CATEGORIES = new Set([
  'Plumbing','Electrical','Carpentry','Construction','Painting','Welding','Masonry','HVAC','Roofing','Flooring'
]);
const REGIONS = new Set([
  'Greater Accra','Ashanti','Western','Eastern','Central','Volta','Northern','Upper East','Upper West','Brong-Ahafo'
]);

const now = () => new Date();

function coerceNumber(n, fallback = null) {
  if (n === null || n === undefined) return fallback;
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function isBlank(str) {
  return !str || String(str).trim().length === 0;
}

function trimString(str) {
  return typeof str === 'string' ? str.trim() : str;
}

function ensureArrayOfStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return [String(value).trim()].filter(Boolean);
}

async function main() {
  await connectDB();
  // Use native driver to avoid any model buffering issues
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  const usersCol = db.collection('users');
  const applicationsCol = db.collection('applications');
  const report = {
    scanned: 0,
    fixed: 0,
    deleted: 0,
    orphanedJobs: 0,
    fieldFixes: {},
    suspiciousDuplicates: 0,
  };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const jobs = await jobsCol.find({}).toArray();
    const titlesSeen = new Map();

    for (const j of jobs) {
      report.scanned += 1;
      const updates = {};
      let fatal = false;

      // Title
      if (isBlank(j.title)) fatal = true;
      else if (j.title !== trimString(j.title)) updates.title = trimString(j.title);

      // Validate hirer (owner) reference - CRITICAL: Jobs must have valid owners
      if (!j.hirer) {
        fatal = true; // Orphaned job without owner
      } else {
        try {
          const hirerId = typeof j.hirer === 'string' 
            ? new mongoose.Types.ObjectId(j.hirer)
            : j.hirer;
          const hirer = await usersCol.findOne({ _id: hirerId }, { projection: { firstName: 1, lastName: 1, companyName: 1, role: 1, email: 1 } });
          
          if (!hirer) {
            fatal = true; // Orphaned job - hirer doesn't exist
          } else {
            // Employer name from hirer
            let employerName = j.employerName;
            if (!employerName) {
              employerName = hirer.companyName || `${hirer.firstName || ''} ${hirer.lastName || ''}`.trim();
              if (!isBlank(employerName)) updates.employerName = employerName;
            }
          }
        } catch (error) {
          fatal = true; // Invalid hirer reference format
        }
      }

      // Location (flat string for UI) from locationDetails
      if (!j.location || isBlank(j.location)) {
        const r = j.locationDetails?.region;
        const d = j.locationDetails?.district;
        if (r || d) updates.location = [d, r].filter(Boolean).join(', ');
      }

      // Salary mapping: budget + paymentType
      if (typeof j.salary !== 'object' || j.salary === null) updates.salary = {};
      const salary = { ...(updates.salary || j.salary || {}) };
      const amount = coerceNumber(j.budget);
      if (amount !== null) salary.amount = amount;
      const type = j.paymentType === 'hourly' ? 'negotiable' : 'fixed';
      salary.type = type;
      updates.salary = salary;

      // Featured/Hot flag (derive from performanceTier or explicit flag)
      if (typeof j.isFeatured !== 'boolean') {
        updates.isFeatured = j.performanceTier === 'tier1';
      }

      // Employer rating (optional; leave if unknown)
      if (j.employerRating !== undefined) {
        const rating = coerceNumber(j.employerRating, null);
        if (rating !== j.employerRating) updates.employerRating = rating;
      }

      // Applicants count from Applications
      try {
        const applicants = await applicationsCol.countDocuments({ job: j._id });
        if (j.applicantsCount !== applicants) updates.applicantsCount = applicants;
      } catch {}

      // Description
      if (isBlank(j.description)) fatal = true;
      else if (j.description !== trimString(j.description)) updates.description = trimString(j.description);

      // Required skills
      const requiredSkills = ensureArrayOfStrings(
        (j.requirements?.primarySkills && j.requirements.primarySkills.length
          ? j.requirements.primarySkills
          : j.skills)
      );
      updates.requiredSkills = requiredSkills;

      // Posted date (createdAt)
      const postedAt = j.createdAt ? new Date(j.createdAt) : null;
      if (!postedAt || Number.isNaN(postedAt.getTime())) fatal = true;
      else if (postedAt > now()) updates.createdAt = now();

      // Apply by deadline: prefer bidding.bidDeadline, else expiresAt
      let applyBy = j.bidding?.bidDeadline || j.expiresAt || null;
      if (!applyBy) {
        // default: 14 days from creation
        applyBy = new Date((updates.createdAt || postedAt || now()).getTime() + 14 * 24 * 60 * 60 * 1000);
        updates['bidding.bidDeadline'] = applyBy;
      } else {
        applyBy = new Date(applyBy);
      }
      if (applyBy <= now()) {
        // extend to future by 14 days if still open
        if (j.status === 'open') {
          const newDeadline = new Date(now().getTime() + 14 * 24 * 60 * 60 * 1000);
          updates['bidding.bidDeadline'] = newDeadline;
        }
      }

      // Category lookup
      if (!isBlank(j.category) && !TRADE_CATEGORIES.has(j.category)) {
        // Try normalize capitalization
        const normalized = j.category && j.category[0].toUpperCase() + j.category.slice(1).toLowerCase();
        if (TRADE_CATEGORIES.has(normalized)) updates.category = normalized;
        else updates.category = 'Construction';
      }

      // Region lookup
      const region = j.locationDetails?.region;
      if (region && !REGIONS.has(region)) {
        const normalized = region && region[0].toUpperCase() + region.slice(1).toLowerCase();
        if (REGIONS.has(normalized)) updates['locationDetails.region'] = normalized;
        else updates['locationDetails.region'] = 'Greater Accra';
      }

      // Unique external jobId field
      if (!j.jobId || isBlank(j.jobId)) {
        updates.jobId = `job_${j._id.toString().slice(-8)}`;
      }

      // Duplicate detection (same title+hirer within 24h)
      if (j.title && j.hirer) {
        const key = `${trimString(j.title).toLowerCase()}::${String(j.hirer)}`;
        const first = titlesSeen.get(key);
        if (first) report.suspiciousDuplicates += 1;
        else titlesSeen.set(key, true);
      }

      // Fatal delete
      if (fatal) {
        await jobsCol.deleteOne({ _id: j._id });
        report.deleted += 1;
        // Track if it was orphaned (missing or invalid hirer)
        if (!j.hirer || !await usersCol.findOne({ _id: typeof j.hirer === 'string' ? new mongoose.Types.ObjectId(j.hirer) : j.hirer })) {
          report.orphanedJobs += 1;
        }
        continue;
      }

      // Apply fixes
      if (Object.keys(updates).length > 0) {
        await jobsCol.updateOne({ _id: j._id }, { $set: updates });
        report.fixed += 1;
        for (const k of Object.keys(updates)) {
          report.fieldFixes[k] = (report.fieldFixes[k] || 0) + 1;
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    console.log('=== Jobs Data Cleaner Summary ===');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Cleaner failed:', err);
    process.exit(1);
  }
}

main();


