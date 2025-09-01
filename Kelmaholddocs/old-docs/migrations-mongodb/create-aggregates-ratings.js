#!/usr/bin/env node
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const reviews = mongoose.connection.collection('reviews');
  const workerRatings = mongoose.connection.collection('workerratings');
  const cursor = reviews.aggregate([
    { $match: { status: 'approved' } },
    { $group: {
      _id: '$workerId',
      totalReviews: { $sum: 1 },
      averageRating: { $avg: '$ratings.overall' },
      ratingDistribution: {
        $push: '$ratings.overall'
      }
    }}
  ]);
  const bulk = workerRatings.initializeUnorderedBulkOp();
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const dist = { 1:0,2:0,3:0,4:0,5:0 };
    (doc.ratingDistribution || []).forEach(r => { const k = Math.max(1, Math.min(5, Math.round(r))); dist[k]++; });
    bulk.find({ workerId: doc._id }).upsert().updateOne({
      $set: {
        workerId: doc._id,
        totalReviews: doc.totalReviews,
        averageRating: Math.round((doc.averageRating || 0) * 10) / 10,
        ratingDistribution: dist,
        lastUpdated: new Date()
      }
    });
  }
  if (bulk.length) await bulk.execute();
  console.log('Aggregated ratings updated.');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const Reviews = mongoose.connection.collection('reviews');
  const WorkerRatings = mongoose.connection.collection('workerratings');

  const workers = await Reviews.distinct('workerId');
  for (const workerId of workers) {
    const docs = await Reviews.aggregate([
      { $match: { workerId, status: 'approved' } },
      { $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$ratings.overall' },
          ratingDistribution: {
            $push: '$ratings.overall'
          }
        }
      }
    ]).toArray();
    const doc = docs[0] || { totalReviews: 0, averageRating: 0, ratingDistribution: [] };
    const dist = { 1:0,2:0,3:0,4:0,5:0 };
    for (const r of doc.ratingDistribution) {
      dist[Math.round(r)] += 1;
    }
    await WorkerRatings.updateOne(
      { workerId },
      {
        $set: {
          totalReviews: doc.totalReviews,
          averageRating: Number(doc.averageRating || 0),
          ratingDistribution: dist,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
  }
  console.log('Aggregated ratings updated.');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });


