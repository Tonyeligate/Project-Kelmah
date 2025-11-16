/**
 * Index Manager for Job Service
 * Ensures critical MongoDB indexes exist to keep high-traffic queries responsive.
 */

const ensured = {
  jobs: false,
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

module.exports = {
  ensureJobIndexes,
};
