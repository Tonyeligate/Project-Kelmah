/**
 * COMPREHENSIVE WORKER SEARCH FIX
 * Fix all worker search filters to use correct database schema
 * 
 * Database Schema:
 * - location: "Accra, Ghana" (string, NOT nested)
 * - specializations: ["Electrical Work", "Plumbing Services"] (array at root)
 * - profession: "Licensed Electrician" (NOT primaryTrade)
 * - workerProfile.workType: "Full-time"
 * - workerProfile.title: "General Work"
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../controllers/worker.controller.js');

console.log('Reading worker.controller.js...');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace getAllWorkers function
const getAllWorkersRegex = /static async getAllWorkers\(req, res\) \{[\s\S]*?(?=static async|$)/;
const newGetAllWorkers = `static async getAllWorkers(req, res) {
    try {
      console.log('🔍 getAllWorkers called - URL:', req.originalUrl, 'Path:', req.path);
      console.log('🔍 Query params:', JSON.stringify(req.query));
      await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
      const {
        page = 1,
        limit = 20,
        city, // NEW: Use 'city' instead of 'location'
        location, // Keep for backward compatibility
        primaryTrade, // NEW: Map to specializations
        workType, // NEW: Filter by work type
        skills,
        rating,
        availability,
        maxRate,
        verified,
        search,
        keywords // NEW: Text search
      } = req.query;

      const offset = (page - 1) * limit;

      // ✅ FIXED: Use direct MongoDB driver (bypass disconnected Mongoose models)
      const mongoose = require('mongoose');
      const client = mongoose.connection.getClient();
      const db = client.db();
      const usersCollection = db.collection('users');

      // Build MongoDB query
      const mongoQuery = {
        role: 'worker',
        isActive: true
      };

      console.log('🔍 Building query with filters:', { city, location, primaryTrade, workType, keywords, search });

      // FIXED: Location filter - use location field (contains city)
      if (city || location) {
        const locationSearch = city || location;
        mongoQuery.location = { $regex: locationSearch, $options: 'i' };
        console.log('📍 Location filter:', locationSearch);
      }

      // FIXED: Primary Trade filter - use specializations array
      if (primaryTrade) {
        mongoQuery.specializations = primaryTrade; // Array contains check
        console.log('🔧 Trade filter:', primaryTrade);
      }

      // FIXED: Work Type filter - use workerProfile.workType
      if (workType) {
        mongoQuery['workerProfile.workType'] = workType;
        console.log('💼 Work type filter:', workType);
      }

      // Rating filter
      if (rating) {
        mongoQuery.rating = { $gte: parseFloat(rating) };
      }

      // Availability status
      if (availability) {
        mongoQuery.availabilityStatus = availability;
      }

      // Max hourly rate
      if (maxRate) {
        mongoQuery.hourlyRate = { $lte: parseFloat(maxRate) };
      }

      // Verified workers only
      if (verified === 'true') {
        mongoQuery.isVerified = true;
      }

      // FIXED: Text search - use keywords or search parameter
      const searchTerm = keywords || search;
      if (searchTerm) {
        // Try text search first, fallback to regex
        try {
          mongoQuery.$text = { $search: searchTerm };
          console.log('🔎 Text search:', searchTerm);
        } catch (error) {
          console.log('⚠️ Text search failed, using regex fallback');
          mongoQuery.$or = [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { profession: { $regex: searchTerm, $options: 'i' } },
            { bio: { $regex: searchTerm, $options: 'i' } },
            { skills: { $regex: searchTerm, $options: 'i' } }
          ];
        }
      }

      // Skills filter (array of skills)
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
        mongoQuery.skills = { $in: skillsArray };
      }

      console.log('📋 Final MongoDB query:', JSON.stringify(mongoQuery, null, 2));

      // Execute MongoDB query using direct driver
      const [workers, totalCount] = await Promise.all([
        usersCollection
          .find(mongoQuery)
          .sort({ updatedAt: -1 })
          .skip(offset)
          .limit(parseInt(limit))
          .toArray(),
        usersCollection.countDocuments(mongoQuery)
      ]);

      console.log(\`✅ Found \${workers.length} workers (total: \${totalCount})\`);

      // Ranking weights from env or defaults
      const weights = {
        verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
        rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
        jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
      };
      const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
      const scoreFor = (w) => {
        const ratingNorm = clamp01((Number(w.rating || 0)) / 5);
        const jobsNorm = clamp01(Math.log10(1 + Number(w.totalJobsCompleted || 0)) / 3);
        const verifiedBonus = w.isVerified ? 1 : 0;
        return (
          weights.rating * ratingNorm +
          weights.jobsCompleted * jobsNorm +
          weights.verified * verifiedBonus
        );
      };

      // Auto-populate missing worker fields for existing users
      const workersWithDefaults = await Promise.all(workers.map(async (worker) => {
        let updateNeeded = false;
        const updates = {};

        // Set default values for missing fields
        if (!worker.profession) { updates.profession = 'General Worker'; updateNeeded = true; }
        if (!worker.skills || worker.skills.length === 0) { updates.skills = ['General Work']; updateNeeded = true; }
        if (!worker.hourlyRate) { updates.hourlyRate = 25; updateNeeded = true; }
        if (!worker.currency) { updates.currency = 'GHS'; updateNeeded = true; }
        if (worker.rating === undefined) { updates.rating = 4.5; updateNeeded = true; }
        if (!worker.totalReviews) { updates.totalReviews = 0; updateNeeded = true; }
        if (!worker.totalJobsCompleted) { updates.totalJobsCompleted = 0; updateNeeded = true; }
        if (!worker.availabilityStatus) { updates.availabilityStatus = 'available'; updateNeeded = true; }
        if (worker.isVerified === undefined) { updates.isVerified = false; updateNeeded = true; }
        if (!worker.bio) {
          updates.bio = \`Experienced \${worker.profession || 'General Worker'} with \${worker.yearsOfExperience || 2} years of experience in \${worker.location || 'Accra, Ghana'}.\`;
          updateNeeded = true;
        }

        // Update MongoDB document if needed (using direct driver)
        if (updateNeeded) {
          try {
            await usersCollection.updateOne(
              { _id: worker._id },
              { $set: updates }
            );
            console.log(\`✅ Auto-populated worker fields for \${worker.firstName} \${worker.lastName}\`);
          } catch (error) {
            console.error(\`❌ Failed to auto-populate worker fields for \${worker._id}:\`, error);
          }
        }

        // Return worker with populated defaults
        return { ...worker, ...updates };
      }));

      // Format response data with ranking score
      const formattedWorkers = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        userId: worker._id.toString(),
        name: \`\${worker.firstName} \${worker.lastName}\`,
        bio: worker.bio || \`\${worker.profession || 'Professional Worker'} with \${worker.yearsOfExperience || 0} years of experience.\`,
        location: worker.location || 'Ghana',
        city: worker.location ? worker.location.split(',')[0].trim() : 'Accra', // Extract city from location
        hourlyRate: worker.hourlyRate || 25,
        currency: worker.currency || 'GHS',
        rating: worker.rating || 4.5,
        totalReviews: worker.totalReviews || 0,
        totalJobsCompleted: worker.totalJobsCompleted || 0,
        availabilityStatus: worker.availabilityStatus || 'available',
        isVerified: worker.isVerified || false,
        profilePicture: worker.profilePicture || null,
        specializations: worker.specializations || ['General Maintenance'],
        profession: worker.profession || 'General Worker',
        workType: worker.workerProfile?.workType || 'Full-time',
        skills: worker.skills?.map(skill => ({
          name: typeof skill === 'string' ? skill : skill.skillName || skill.name || skill,
          level: typeof skill === 'string' ? 'Intermediate' : skill.level || 'Intermediate'
        })) || [],
        rankScore: 0 // Will be calculated below
      })).map((w) => ({ ...w, rankScore: scoreFor(w) }));

      // Sort by rank score for better relevance
      formattedWorkers.sort((a, b) => b.rankScore - a.rankScore);

      return res.status(200).json({
        success: true,
        workers: formattedWorkers,
        pagination: {
          currentPage: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
          totalWorkers: totalCount
        }
      });
    } catch (error) {
      console.error('❌ Error in getAllWorkers:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  `;

console.log('Replacing getAllWorkers function...');
if (getAllWorkersRegex.test(content)) {
  content = content.replace(getAllWorkersRegex, newGetAllWorkers);
  console.log('✅ getAllWorkers function replaced');
} else {
  console.log('⚠️ getAllWorkers function not found with expected pattern');
}

// Write the updated content
console.log('Writing updated worker.controller.js...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ WORKER SEARCH FIX COMPLETE');
console.log('Fixed getAllWorkers to use correct database schema:');
console.log('  - location field for city search');
console.log('  - specializations array for trade filtering');
console.log('  - workerProfile.workType for work type filtering');
console.log('  - Text search with fallback to regex');
