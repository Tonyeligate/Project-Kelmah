/**
 * Index Manager for Job Service
 * Ensures critical MongoDB indexes exist to keep high-traffic queries responsive.
 */

const ensured = {
  jobs: false,
  bids: false,
};

/**
 * Ensure indexes for the jobs collection. Safe to call multiple times; execution happens once.
 * @param {import('mongoose').Connection} connection
 */
async function ensureJobIndexes(connection) {
  if (ensured.jobs || !connection) {
    return;
  }

  try {
    const db = connection.connection ? connection.connection.db : connection.db;
    if (!db) {
      console.warn('[JOB INDEX MANAGER] Unable to access database handle for index creation');
      return;
    }

    const jobsCollection = db.collection('jobs');

    // Build the index list once to avoid repeated allocations
    const indexSpecs = [
      {
        key: { status: 1, visibility: 1, createdAt: -1 },
        name: 'jobs_status_visibility_createdAt',
        background: true,
      },
      {
        key: { category: 1, status: 1, visibility: 1 },
        name: 'jobs_category_status_visibility',
        background: true,
      },
      {
        key: { 'location.city': 1, status: 1 },
        name: 'jobs_location_city_status',
        background: true,
      },
      {
        key: { 'location.region': 1, status: 1 },
        name: 'jobs_location_region_status',
        background: true,
      },
      {
        key: { createdAt: -1 },
        name: 'jobs_createdAt_desc',
        background: true,
      },
      // Text index for full-text search (replaces regex scans)
      {
        key: { title: 'text', description: 'text', category: 'text', skills: 'text' },
        name: 'jobs_text_search',
        background: true,
        weights: { title: 10, skills: 5, category: 3, description: 1 },
        default_language: 'english',
      },
      // Fix location index paths to match actual data structure
      {
        key: { 'locationDetails.region': 1, status: 1 },
        name: 'jobs_locationDetails_region_status',
        background: true,
      },
      {
        key: { 'locationDetails.district': 1, status: 1 },
        name: 'jobs_locationDetails_district_status',
        background: true,
      },
      // Compound index for recommendations query
      {
        key: { status: 1, 'bidding.bidStatus': 1, skills: 1 },
        name: 'jobs_status_bidding_skills',
        background: true,
      },
      // Hirer lookup index
      {
        key: { hirer: 1, status: 1, createdAt: -1 },
        name: 'jobs_hirer_status_createdAt',
        background: true,
      },
    ];

    await Promise.all(
      indexSpecs.map((spec) =>
        jobsCollection
          .createIndex(spec.key, { name: spec.name, background: spec.background })
          .catch((error) => {
            // Log but don't rethrow so one failure doesn't block others
            console.warn(
              `[JOB INDEX MANAGER] Failed to create index ${spec.name}: ${error.message}`,
            );
          }),
      ),
    );

    ensured.jobs = true;
    console.log('[JOB INDEX MANAGER] Job indexes ensured');
  } catch (error) {
    console.warn('[JOB INDEX MANAGER] Error ensuring job indexes:', error.message);
  }
}

/**
 * Ensure indexes for the bids collection.
 * @param {import('mongoose').Connection} connection
 */
async function ensureBidIndexes(connection) {
  if (ensured.bids || !connection) {
    return;
  }

  try {
    const db = connection.connection ? connection.connection.db : connection.db;
    if (!db) return;

    const bidsCollection = db.collection('bids');

    const indexSpecs = [
      {
        key: { job: 1, worker: 1 },
        name: 'bids_job_worker_unique',
        unique: true,
        background: true,
      },
      {
        key: { worker: 1, bidTimestamp: -1 },
        name: 'bids_worker_timestamp',
        background: true,
      },
      {
        key: { job: 1, status: 1, bidTimestamp: -1 },
        name: 'bids_job_status_timestamp',
        background: true,
      },
    ];

    await Promise.all(
      indexSpecs.map((spec) =>
        bidsCollection
          .createIndex(spec.key, { name: spec.name, unique: spec.unique || false, background: spec.background })
          .catch((error) => {
            console.warn(`[JOB INDEX MANAGER] Failed to create bid index ${spec.name}: ${error.message}`);
          }),
      ),
    );

    ensured.bids = true;
    console.log('[JOB INDEX MANAGER] Bid indexes ensured');
  } catch (error) {
    console.warn('[JOB INDEX MANAGER] Error ensuring bid indexes:', error.message);
  }
}

module.exports = {
  ensureJobIndexes,
  ensureBidIndexes,
};
