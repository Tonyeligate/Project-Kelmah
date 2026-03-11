/**
 * Worker Profile Controller
 * Handles all worker-related operations
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const modelsModule = require('../models');
// DO NOT destructure models at module load time - use modelsModule.ModelName or local variables
// Models are loaded AFTER database connection, so they're undefined at module load time
const { ensureConnection } = require('../config/db');
const { validateInput, handleServiceError, generatePagination } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');
const { verifyAccessToken, decodeUserFromClaims } = require('../../../shared/utils/jwt');
const { escapeRegex } = require('../../../shared/utils/sanitize');
const { buildCanonicalWorkerSnapshot } = require('../../../shared/utils/canonicalWorker');
const { logger } = require('../utils/logger');

const sanitizeText = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!(?:lt|gt|amp|quot|#\d+);)/g, '&amp;')
    .trim();
};

const REQUIRED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'profession',
  'bio',
  'location',
  'hourlyRate',
  'skills',
];

const OPTIONAL_PROFILE_FIELDS = [
  'profilePicture',
  'phone',
  'website',
  'portfolio',
  'certifications',
  'yearsOfExperience',
];

// Normalised mapping between UI trade filters and stored worker values
// ALGO IMPROVEMENT: Expanded synonym map with 8 additional trades for better coverage
const TRADE_SYNONYM_MAP = {
  carpentry: ['Carpentry', 'Carpenter', 'Carpentry & Woodwork', 'Woodwork', 'Joinery', 'Cabinet Maker', 'Furniture Making', 'Woodworker'],
  masonry: ['Masonry', 'Mason', 'Masonry & Stonework', 'Bricklayer', 'Stonework', 'Block Layer', 'Stone Mason', 'Blockwork'],
  plumbing: ['Plumbing', 'Plumber', 'Plumbing Services', 'Pipe Fitting', 'Pipe Fitter', 'Water Systems', 'Sanitary'],
  'electrical work': ['Electrical Work', 'Electrician', 'Licensed Electrician', 'Electrical Engineer', 'Electrical Services', 'Wiring', 'Power Systems'],
  painting: ['Painting', 'Painter', 'Painting & Decoration', 'Decorating', 'Spray Painting', 'Wall Finishing'],
  welding: ['Welding', 'Welder', 'Welding Services', 'Metal Work', 'Metal Fabrication', 'Fabrication', 'Steel Work', 'Ironwork'],
  roofing: ['Roofing', 'Roofer', 'Roofing Services', 'Roof Installation', 'Roof Repair', 'Roof Tiling'],
  flooring: ['Flooring', 'Flooring Specialist', 'Tile & Flooring', 'Tiling', 'Tiler', 'Floor Installation', 'Floor Finishing'],
  hvac: ['HVAC', 'HVAC & Climate Control', 'Air Conditioning', 'Air Conditioning Technician', 'Refrigeration', 'Cooling Systems', 'Heating'],
  landscaping: ['Landscaping', 'Landscaper', 'Gardener', 'Landscaping Services', 'Lawn Care', 'Garden Design', 'Grounds Maintenance'],
  'general construction': ['General Construction', 'Construction', 'Construction & Building', 'Builder', 'General Contractor', 'Site Work'],
  maintenance: ['Maintenance', 'General Maintenance', 'Handyman', 'Repair', 'Property Maintenance', 'Fix-it'],
  'solar installation': ['Solar Installation', 'Solar Panel', 'Solar Technician', 'Solar Energy', 'PV Installation'],
  glazing: ['Glazing', 'Glazier', 'Glass Installation', 'Window Fitting', 'Glass Work'],
  'interior design': ['Interior Design', 'Interior Decorator', 'Home Design', 'Space Planning'],
  'pest control': ['Pest Control', 'Fumigation', 'Exterminator'],
  'auto mechanic': ['Auto Mechanic', 'Car Mechanic', 'Vehicle Repair', 'Automotive Repair', 'Motor Mechanic'],
  tailoring: ['Tailoring', 'Tailor', 'Seamstress', 'Dressmaking', 'Fashion Design'],
  catering: ['Catering', 'Cook', 'Chef', 'Food Service', 'Event Catering'],
};

const LANDING_TRADE_CATEGORIES = [
  { key: 'carpentry', label: 'Carpentry', trade: 'carpentry' },
  { key: 'masonry', label: 'Masonry', trade: 'masonry' },
  { key: 'electrical', label: 'Electrical', trade: 'electrical' },
  { key: 'plumbing', label: 'Plumbing', trade: 'plumbing' },
  { key: 'painting', label: 'Painting', trade: 'painting' },
  { key: 'roofing', label: 'Roofing', trade: 'roofing' },
];

const buildTradeRegexes = (trade) => {
  if (!trade) {
    return [];
  }

  const normalisedKey = trade.trim().toLowerCase();
  const synonyms = TRADE_SYNONYM_MAP[normalisedKey] || [trade];
  const canonical = Array.from(new Set([trade, ...synonyms]));
  return canonical.map((term) => new RegExp(escapeRegex(term), 'i'));
};

const WORKER_RANK_WEIGHTS = {
  verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.25),
  rating: Number(process.env.RANK_WEIGHT_RATING || 0.40),
  jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.20),
  recency: Number(process.env.RANK_WEIGHT_RECENCY || 0.15),
};

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

// ALGO IMPROVEMENT: Added recency decay so recently-active workers rank higher
const scoreWorker = (worker = {}) => {
  const ratingNorm = clamp01(Number(worker.rating || 0) / 5);
  const jobsNorm = clamp01(
    Math.log10(1 + Number(worker.totalJobsCompleted || 0)) / 3,
  );
  const verifiedBonus = worker.isVerified ? 1 : 0;

  // Recency: workers active in last 30 days score 1.0, decaying to 0 over 180 days
  const lastActive = worker.updatedAt || worker.createdAt;
  let recencyNorm = 0.5; // default for unknown
  if (lastActive) {
    const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
    recencyNorm = clamp01(1 - (daysSinceActive / 180));
  }

  return (
    WORKER_RANK_WEIGHTS.rating * ratingNorm +
    WORKER_RANK_WEIGHTS.jobsCompleted * jobsNorm +
    WORKER_RANK_WEIGHTS.verified * verifiedBonus +
    WORKER_RANK_WEIGHTS.recency * recencyNorm
  );
};

const normalizeDelimitedList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item || '').split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const buildArrayToSearchStringExpression = (fieldPath) => ({
  $reduce: {
    input: { $ifNull: [fieldPath, []] },
    initialValue: '',
    in: {
      $concat: [
        '$$value',
        ' ',
        {
          $toLower: {
            $ifNull: [
              {
                $cond: [
                  { $eq: [{ $type: '$$this' }, 'object'] },
                  {
                    $ifNull: [
                      '$$this.name',
                      {
                        $ifNull: ['$$this.skillName', { $ifNull: ['$$this.label', ''] }],
                      },
                    ],
                  },
                  { $toString: '$$this' },
                ],
              },
              '',
            ],
          },
        },
      ],
    },
  },
});

const buildTextRelevanceScoreExpression = (textQuery = '') => {
  const normalizedQuery = toSafeString(textQuery, '').trim().toLowerCase();
  if (!normalizedQuery) {
    return { $literal: 0 };
  }

  const tokens = Array.from(
    new Set(
      normalizedQuery
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1),
    ),
  ).slice(0, 6);

  const professionInput = { $toLower: { $ifNull: ['$canonicalProfession', ''] } };
  const nameInput = {
    $toLower: {
      $concat: [
        { $ifNull: ['$canonicalFirstName', ''] },
        ' ',
        { $ifNull: ['$canonicalLastName', ''] },
      ],
    },
  };
  const bioInput = { $toLower: { $ifNull: ['$canonicalBio', ''] } };
  const locationInput = { $toLower: { $ifNull: ['$canonicalLocation', ''] } };
  const skillsInput = buildArrayToSearchStringExpression('$canonicalSkills');
  const specializationsInput = buildArrayToSearchStringExpression('$canonicalSpecializations');
  const exactPattern = escapeRegex(normalizedQuery);

  const scoreParts = [
    { $cond: [{ $regexMatch: { input: professionInput, regex: exactPattern } }, 140, 0] },
    { $cond: [{ $regexMatch: { input: skillsInput, regex: exactPattern } }, 120, 0] },
    { $cond: [{ $regexMatch: { input: specializationsInput, regex: exactPattern } }, 110, 0] },
    { $cond: [{ $regexMatch: { input: nameInput, regex: exactPattern } }, 90, 0] },
    { $cond: [{ $regexMatch: { input: bioInput, regex: exactPattern } }, 40, 0] },
    { $cond: [{ $regexMatch: { input: locationInput, regex: exactPattern } }, 20, 0] },
  ];

  tokens.forEach((token) => {
    const tokenPattern = escapeRegex(token);
    scoreParts.push({ $cond: [{ $regexMatch: { input: professionInput, regex: tokenPattern } }, 30, 0] });
    scoreParts.push({ $cond: [{ $regexMatch: { input: skillsInput, regex: tokenPattern } }, 24, 0] });
    scoreParts.push({ $cond: [{ $regexMatch: { input: specializationsInput, regex: tokenPattern } }, 22, 0] });
    scoreParts.push({ $cond: [{ $regexMatch: { input: nameInput, regex: tokenPattern } }, 16, 0] });
    scoreParts.push({ $cond: [{ $regexMatch: { input: bioInput, regex: tokenPattern } }, 8, 0] });
    scoreParts.push({ $cond: [{ $regexMatch: { input: locationInput, regex: tokenPattern } }, 4, 0] });
  });

  return { $add: scoreParts };
};

const buildWorkerDirectorySortClause = (sortBy = 'relevance') => {
  switch (sortBy) {
    case 'distance':
      return { canonicalTextScore: -1, canonicalUpdatedAt: -1, canonicalRating: -1 };
    case 'rating':
      return { canonicalTextScore: -1, canonicalRating: -1, canonicalCompletedJobs: -1, canonicalUpdatedAt: -1 };
    case 'price_low':
      return { canonicalTextScore: -1, canonicalHourlyRate: 1, canonicalRating: -1 };
    case 'price_high':
      return { canonicalTextScore: -1, canonicalHourlyRate: -1, canonicalRating: -1 };
    case 'experience':
      return { canonicalTextScore: -1, canonicalCompletedJobs: -1, canonicalExperience: -1, canonicalRating: -1 };
    case 'newest':
      return { canonicalTextScore: -1, canonicalUpdatedAt: -1 };
    default:
      return {
        canonicalTextScore: -1,
        canonicalVerified: -1,
        canonicalRating: -1,
        canonicalCompletedJobs: -1,
        canonicalUpdatedAt: -1,
      };
  }
};

const buildWorkerGeoSearch = ({ latitude, longitude, radius }) => {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    return null;
  }

  if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
    return null;
  }

  const parsedRadius = Number(radius);
  const radiusKm = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 50;
  const latitudeDelta = radiusKm / 111.32;
  const longitudeScale = Math.cos((parsedLatitude * Math.PI) / 180);
  const longitudeDelta = radiusKm / (111.32 * Math.max(Math.abs(longitudeScale), 0.01));

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    radiusKm,
    minLatitude: Math.max(-90, parsedLatitude - latitudeDelta),
    maxLatitude: Math.min(90, parsedLatitude + latitudeDelta),
    minLongitude: Math.max(-180, parsedLongitude - longitudeDelta),
    maxLongitude: Math.min(180, parsedLongitude + longitudeDelta),
  };
};

const buildWorkerDirectoryPrefilterConditions = ({
  locationText,
  workType,
  minRating,
  maxRate,
  availability,
  verified,
}) => {
  const conditions = [
    { userId: { $exists: true, $ne: null } },
  ];

  if (locationText) {
    conditions.push({
      $or: [
        { location: { $regex: escapeRegex(locationText), $options: 'i' } },
        { location: { $exists: false } },
        { location: null },
        { location: '' },
      ],
    });
  }

  if (workType) {
    conditions.push({
      $or: [
        { preferredJobTypes: workType },
        { workingHoursPreference: workType },
      ],
    });
  }

  if (Number.isFinite(minRating) && minRating > 0) {
    conditions.push({
      $or: [
        { rating: { $gte: minRating } },
        { rating: { $exists: false } },
        { rating: null },
      ],
    });
  }

  if (Number.isFinite(maxRate) && maxRate > 0) {
    conditions.push({
      $or: [
        { hourlyRate: { $lte: maxRate } },
        { hourlyRate: { $exists: false } },
        { hourlyRate: null },
      ],
    });
  }

  if (availability) {
    conditions.push({
      $or: [
        { availabilityStatus: availability },
        { availabilityStatus: { $exists: false } },
        { availabilityStatus: null },
      ],
    });
  }

  if (verified) {
    conditions.push({
      $or: [
        { isVerified: true },
        { isVerified: { $exists: false } },
        { isVerified: null },
      ],
    });
  }

  return conditions;
};

const buildWorkerDirectoryConditions = ({
  textQuery,
  locationText,
  primaryTrade,
  workType,
  skillsList,
  minRating,
  maxRate,
  availability,
  verified,
  geoSearch,
}) => {
  const conditions = [];

  if (locationText) {
    conditions.push({ canonicalLocation: { $regex: escapeRegex(locationText), $options: 'i' } });
  }

  if (textQuery) {
    const textRegex = { $regex: escapeRegex(textQuery), $options: 'i' };
    conditions.push({
      $or: [
        { canonicalFirstName: textRegex },
        { canonicalLastName: textRegex },
        { canonicalProfession: textRegex },
        { canonicalBio: textRegex },
        { canonicalLocation: textRegex },
        { canonicalSkills: textRegex },
        { canonicalSpecializations: textRegex },
      ],
    });
  }

  if (primaryTrade) {
    const tradeRegexes = buildTradeRegexes(primaryTrade);
    if (tradeRegexes.length > 0) {
      conditions.push({
        $or: [
          { canonicalProfession: { $in: tradeRegexes } },
          { canonicalSkills: { $in: tradeRegexes } },
          { canonicalSpecializations: { $in: tradeRegexes } },
        ],
      });
    }
  }

  if (workType) {
    conditions.push({
      $or: [
        { canonicalPreferredJobTypes: workType },
        { canonicalWorkingHoursPreference: workType },
      ],
    });
  }

  if (skillsList.length > 0) {
    const skillRegexes = skillsList.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, 'i'));
    conditions.push({
      $or: [
        { canonicalSkills: { $in: skillRegexes } },
        { canonicalSpecializations: { $in: skillRegexes } },
      ],
    });
  }

  if (Number.isFinite(minRating) && minRating > 0) {
    conditions.push({ canonicalRating: { $gte: minRating } });
  }

  if (Number.isFinite(maxRate) && maxRate > 0) {
    conditions.push({ canonicalHourlyRate: { $lte: maxRate } });
  }

  if (availability) {
    conditions.push({ canonicalAvailability: availability });
  }

  if (verified) {
    conditions.push({ canonicalVerified: true });
  }

  if (geoSearch) {
    conditions.push({
      canonicalLatitude: {
        $gte: geoSearch.minLatitude,
        $lte: geoSearch.maxLatitude,
      },
    });
    conditions.push({
      canonicalLongitude: {
        $gte: geoSearch.minLongitude,
        $lte: geoSearch.maxLongitude,
      },
    });
  }

  return conditions;
};

const formatWorkerDirectoryWorkers = (workerDocs = [], geoSearch = null) =>
  workerDocs
    .map((workerDoc) => {
      const canonicalWorker = buildCanonicalWorkerSnapshot(workerDoc.user || {}, workerDoc);
      const workerLat = Number(
        workerDoc?.canonicalLatitude ??
        workerDoc?.latitude ??
        workerDoc?.user?.latitude ??
        workerDoc?.user?.locationCoordinates?.coordinates?.[1],
      );
      const workerLng = Number(
        workerDoc?.canonicalLongitude ??
        workerDoc?.longitude ??
        workerDoc?.user?.longitude ??
        workerDoc?.user?.locationCoordinates?.coordinates?.[0],
      );
      const hasCoordinates = Number.isFinite(workerLat) && Number.isFinite(workerLng);
      const distance = geoSearch && hasCoordinates
        ? Math.round(
          haversineDistance(
            geoSearch.latitude,
            geoSearch.longitude,
            workerLat,
            workerLng,
          ) * 10,
        ) / 10
        : null;

      return {
        id: canonicalWorker.id,
        userId: canonicalWorker.userId,
        name: canonicalWorker.name,
        bio: canonicalWorker.bio || `${canonicalWorker.profession} with ${canonicalWorker.yearsOfExperience || 0} years of experience.`,
        location: canonicalWorker.location,
        city: canonicalWorker.location ? canonicalWorker.location.split(',')[0].trim() : 'Accra',
        hourlyRate: canonicalWorker.hourlyRate || 25,
        currency: canonicalWorker.currency || 'GHS',
        rating: canonicalWorker.rating || 0,
        totalReviews: canonicalWorker.totalReviews || 0,
        totalJobsCompleted: canonicalWorker.totalJobsCompleted || 0,
        availabilityStatus: canonicalWorker.availabilityStatus || 'available',
        isVerified: canonicalWorker.isVerified || false,
        profilePicture: canonicalWorker.profilePicture || null,
        specializations: canonicalWorker.specializations.length > 0 ? canonicalWorker.specializations : ['General Maintenance'],
        profession: canonicalWorker.profession || 'General Worker',
        workType: canonicalWorker.workType || 'Full-time',
        skills: canonicalWorker.skills,
        rankScore: scoreWorker(canonicalWorker),
        latitude: hasCoordinates ? workerLat : null,
        longitude: hasCoordinates ? workerLng : null,
        distance,
        createdAt: canonicalWorker.createdAt,
        updatedAt: canonicalWorker.updatedAt,
      };
    })
    .filter((worker) => !geoSearch || (worker.distance !== null && worker.distance <= geoSearch.radiusKm));

const executeWorkerDirectoryQuery = async ({
  page = 1,
  limit = 20,
  textQuery = '',
  locationText = '',
  primaryTrade = '',
  workType = '',
  skillsList = [],
  minRating = 0,
  maxRate,
  availability,
  verified = false,
  sortBy = 'relevance',
  latitude,
  longitude,
  radius,
}) => {
  await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });

  if (typeof modelsModule.loadModels === 'function') {
    modelsModule.loadModels();
  }

  const MongoUser = modelsModule.User;
  const WorkerProfileModel = modelsModule.WorkerProfile;

  if (!MongoUser) {
    throw new Error('User model not initialized');
  }

  if (!WorkerProfileModel) {
    throw new Error('WorkerProfile model not initialized');
  }

  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  const usersCollection = MongoUser.collection?.collectionName || 'users';
  const geoSearch = buildWorkerGeoSearch({ latitude, longitude, radius });
  const prefilterConditions = buildWorkerDirectoryPrefilterConditions({
    locationText,
    workType,
    minRating: Number(minRating),
    maxRate: Number(maxRate),
    availability,
    verified,
  });

  const pipeline = [
    { $match: { $and: prefilterConditions } },
    {
      $lookup: {
        from: usersCollection,
        let: { workerUserId: '$userId' },
        pipeline: [
          {
            $match: {
              role: 'worker',
              isActive: true,
              $expr: { $eq: ['$_id', '$$workerUserId'] },
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        canonicalFirstName: { $ifNull: ['$user.firstName', ''] },
        canonicalLastName: { $ifNull: ['$user.lastName', ''] },
        canonicalProfession: {
          $ifNull: [
            '$profession',
            {
              $ifNull: [
                '$title',
                {
                  $ifNull: [
                    '$headline',
                    {
                      $ifNull: [
                        '$user.profession',
                        {
                          $ifNull: [{ $arrayElemAt: ['$specializations', 0] }, { $arrayElemAt: ['$skills', 0] }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        canonicalRating: { $ifNull: ['$rating', '$user.rating'] },
        canonicalHourlyRate: { $ifNull: ['$hourlyRate', '$user.hourlyRate'] },
        canonicalCompletedJobs: { $ifNull: ['$totalJobsCompleted', '$user.totalJobsCompleted'] },
        canonicalAvailability: { $ifNull: ['$availabilityStatus', '$user.availabilityStatus'] },
        canonicalVerified: { $ifNull: ['$isVerified', '$user.isVerified'] },
        canonicalLocation: { $ifNull: ['$location', '$user.location'] },
        canonicalBio: { $ifNull: ['$bio', '$user.bio'] },
        canonicalUpdatedAt: { $ifNull: ['$updatedAt', '$user.updatedAt'] },
        canonicalExperience: { $ifNull: ['$yearsOfExperience', '$user.yearsOfExperience'] },
        canonicalPreferredJobTypes: { $ifNull: ['$preferredJobTypes', []] },
        canonicalWorkingHoursPreference: { $ifNull: ['$workingHoursPreference', null] },
        canonicalLatitude: {
          $convert: {
            input: {
              $ifNull: [
                '$latitude',
                {
                  $ifNull: [
                    '$user.latitude',
                    { $arrayElemAt: [{ $ifNull: ['$user.locationCoordinates.coordinates', []] }, 1] },
                  ],
                },
              ],
            },
            to: 'double',
            onError: null,
            onNull: null,
          },
        },
        canonicalLongitude: {
          $convert: {
            input: {
              $ifNull: [
                '$longitude',
                {
                  $ifNull: [
                    '$user.longitude',
                    { $arrayElemAt: [{ $ifNull: ['$user.locationCoordinates.coordinates', []] }, 0] },
                  ],
                },
              ],
            },
            to: 'double',
            onError: null,
            onNull: null,
          },
        },
        canonicalSkills: {
          $setUnion: [
            { $ifNull: ['$skills', []] },
            { $ifNull: ['$user.skills', []] },
            {
              $map: {
                input: { $ifNull: ['$skillEntries', []] },
                as: 'skillEntry',
                in: '$$skillEntry.name',
              },
            },
          ],
        },
        canonicalSpecializations: {
          $setUnion: [
            { $ifNull: ['$specializations', []] },
            { $ifNull: ['$user.specializations', []] },
          ],
        },
        canonicalTextScore: buildTextRelevanceScoreExpression(textQuery),
      },
    },
  ];

  const conditions = buildWorkerDirectoryConditions({
    textQuery,
    locationText,
    primaryTrade,
    workType,
    skillsList,
    minRating: Number(minRating),
    maxRate: Number(maxRate),
    availability,
    verified,
    geoSearch,
  });

  if (conditions.length > 0) {
    pipeline.push({ $match: { $and: conditions } });
  }

  if (geoSearch) {
    pipeline.push({ $sort: buildWorkerDirectorySortClause(sortBy) });

    const rawWorkers = await WorkerProfileModel.aggregate(pipeline);
    const exactGeoMatches = formatWorkerDirectoryWorkers(rawWorkers, geoSearch);

    if (sortBy === 'distance') {
      exactGeoMatches.sort((left, right) => {
        const leftDistance = Number.isFinite(left.distance) ? left.distance : Number.POSITIVE_INFINITY;
        const rightDistance = Number.isFinite(right.distance) ? right.distance : Number.POSITIVE_INFINITY;
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return (right.rankScore || 0) - (left.rankScore || 0);
      });
    }

    return {
      workers: exactGeoMatches.slice(offset, offset + parsedLimit),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: exactGeoMatches.length,
        pages: Math.max(1, Math.ceil(exactGeoMatches.length / parsedLimit)),
      },
    };
  }

  pipeline.push(
    { $sort: buildWorkerDirectorySortClause(sortBy) },
    {
      $facet: {
        items: [
          { $skip: offset },
          { $limit: parsedLimit },
        ],
        total: [
          { $count: 'count' },
        ],
      },
    },
  );

  const [result] = await WorkerProfileModel.aggregate(pipeline);
  const rawWorkers = Array.isArray(result?.items) ? result.items : [];
  const totalCount = result?.total?.[0]?.count || 0;
  const formattedWorkers = formatWorkerDirectoryWorkers(rawWorkers, null);

  return {
    workers: formattedWorkers,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: totalCount,
      pages: Math.max(1, Math.ceil(totalCount / parsedLimit)),
    },
  };
};

const buildTradeCategoryFacet = () =>
  LANDING_TRADE_CATEGORIES.reduce((facet, category) => {
    const tradeRegexes = buildTradeRegexes(category.trade);
    facet[category.key] = [
      {
        $match: {
          $or: [
            { canonicalProfession: { $in: tradeRegexes } },
            { canonicalSkills: { $in: tradeRegexes } },
            { canonicalSpecializations: { $in: tradeRegexes } },
          ],
        },
      },
      { $count: 'count' },
    ];
    return facet;
  }, {});

const executeTradeCategoryStatsQuery = async () => {
  await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });

  if (typeof modelsModule.loadModels === 'function') {
    modelsModule.loadModels();
  }

  const MongoUser = modelsModule.User;
  const WorkerProfileModel = modelsModule.WorkerProfile;

  if (!MongoUser) {
    throw new Error('User model not initialized');
  }

  if (!WorkerProfileModel) {
    throw new Error('WorkerProfile model not initialized');
  }

  const usersCollection = MongoUser.collection?.collectionName || 'users';
  const pipeline = [
    {
      $match: {
        userId: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: usersCollection,
        let: { workerUserId: '$userId' },
        pipeline: [
          {
            $match: {
              role: 'worker',
              isActive: true,
              $expr: { $eq: ['$_id', '$$workerUserId'] },
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $match: {
        'user.0': { $exists: true },
      },
    },
    {
      $addFields: {
        canonicalProfession: {
          $ifNull: [
            '$title',
            {
              $ifNull: [
                '$headline',
                {
                  $ifNull: ['$profession', { $ifNull: ['$user.profession', ''] }],
                },
              ],
            },
          ],
        },
        canonicalSkills: {
          $setUnion: [
            { $ifNull: ['$skills', []] },
            { $ifNull: ['$user.skills', []] },
            {
              $map: {
                input: { $ifNull: ['$skillEntries', []] },
                as: 'skillEntry',
                in: '$$skillEntry.name',
              },
            },
          ],
        },
        canonicalSpecializations: {
          $setUnion: [
            { $ifNull: ['$specializations', []] },
            { $ifNull: ['$user.specializations', []] },
          ],
        },
      },
    },
    {
      $facet: buildTradeCategoryFacet(),
    },
  ];

  const [result] = await WorkerProfileModel.aggregate(pipeline);

  return LANDING_TRADE_CATEGORIES.map(({ key, label }) => ({
    key,
    label,
    query: key,
    count: result?.[key]?.[0]?.count || 0,
  }));
};

// Haversine distance calculator (returns km)
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatWorkerForResponse = (workerDoc) => {
  if (!workerDoc) {
    return null;
  }

  return {
    id: workerDoc._id.toString(),
    userId: workerDoc._id.toString(),
    name: `${workerDoc.firstName || ''} ${workerDoc.lastName || ''}`.trim(),
    bio:
      workerDoc.bio ||
      `${workerDoc.profession || 'Professional Worker'} with ${workerDoc.yearsOfExperience || 0
      } years of experience.`,
    location: workerDoc.location || 'Ghana',
    city: workerDoc.location
      ? workerDoc.location.split(',')[0].trim()
      : 'Accra',
    hourlyRate: workerDoc.hourlyRate || 25,
    currency: workerDoc.currency || 'GHS',
    rating: workerDoc.rating || 0,
    totalReviews: workerDoc.totalReviews || 0,
    totalJobsCompleted: workerDoc.totalJobsCompleted || 0,
    availabilityStatus: workerDoc.availabilityStatus || 'available',
    isVerified: workerDoc.isVerified || false,
    profilePicture: workerDoc.profilePicture || null,
    specializations: workerDoc.specializations || ['General Maintenance'],
    profession: workerDoc.profession || 'General Worker',
    workType: workerDoc.workerProfile?.workType || 'Full-time',
    skills:
      workerDoc.skills?.map((skill) => ({
        name:
          typeof skill === 'string'
            ? skill
            : skill.skillName || skill.name || skill,
        level: typeof skill === 'string' ? 'Intermediate' : skill.level || 'Intermediate',
      })) || [],
    rankScore: scoreWorker(workerDoc),
  };
};

const buildProfileFallbackPayload = (reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  completionPercentage: 0,
  requiredCompletion: 0,
  optionalCompletion: 0,
  missingRequired: [...REQUIRED_PROFILE_FIELDS],
  missingOptional: [...OPTIONAL_PROFILE_FIELDS],
  recommendations: [
    'Complete your professional bio',
    'Add your profile picture',
    'List your certifications',
    'Update your portfolio',
  ],
  source: {
    user: false,
    workerProfile: false,
  },
  fallback: true,
  fallbackReason: reason,
});

const buildAvailabilityFallbackPayload = (workerId = null, reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  status: 'not_set',
  isAvailable: true,
  timezone: 'Africa/Accra',
  daySlots: [],
  schedule: [],
  nextAvailable: null,
  message: 'Availability temporarily unavailable',
  pausedUntil: null,
  lastUpdated: null,
  fallback: true,
  fallbackReason: reason,
  user: workerId,
});

const isNil = (value) => value === null || value === undefined;

const toIsoString = (value) => {
  if (isNil(value)) {
    return null;
  }

  try {
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
      return null;
    }
    return dateValue.toISOString();
  } catch (err) {
    return null;
  }
};

const toSafeString = (value, fallback = '') => {
  if (isNil(value)) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toString === 'function') {
    try {
      const stringified = value.toString();
      return typeof stringified === 'string' ? stringified : fallback;
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  if (isNil(value)) {
    return fallback;
  }

  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toSafeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
      return false;
    }
    return fallback;
  }

  if (!isNil(value)) {
    return Boolean(value);
  }

  return fallback;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => !isNil(item));
  }
  return [];
};

const uniqBy = (items = [], getKey = (item) => item) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    if (isNil(item)) {
      return;
    }

    const key = getKey(item);
    if (isNil(key)) {
      return;
    }

    const keyString = String(key).toLowerCase();
    if (seen.has(keyString)) {
      return;
    }

    seen.add(keyString);
    result.push(item);
  });

  return result;
};

const normalizeSkill = (skill, source = 'user') => {
  if (isNil(skill)) {
    return null;
  }

  if (typeof skill === 'string') {
    const trimmed = skill.trim();
    return trimmed
      ? {
        name: trimmed,
        level: 'Intermediate',
        source,
      }
      : null;
  }

  if (typeof skill === 'object') {
    const name = toSafeString(skill.name || skill.skillName || skill.title || skill._id).trim();
    if (!name) {
      return null;
    }

    const level = toSafeString(skill.level || skill.proficiency || skill.skillLevel || 'Intermediate').trim();

    return {
      name,
      level: level || 'Intermediate',
      source,
    };
  }

  const fallbackName = toSafeString(skill).trim();
  return fallbackName
    ? {
      name: fallbackName,
      level: 'Intermediate',
      source,
    }
    : null;
};

// Circuit breaker to prevent hammering the job service when it's unhealthy
const jobServiceCircuitBreaker = {
  state: 'closed',
  failureCount: 0,
  maxFailures: Number(process.env.JOB_SERVICE_CIRCUIT_MAX_FAILURES || 3),
  cooldownMs: Number(process.env.JOB_SERVICE_CIRCUIT_COOLDOWN_MS || 60_000),
  openedAt: null,
  lastFailureAt: null,
  lastSuccessAt: null,
  lastSuccessPayload: null,
};

const getCircuitBreakerSnapshot = () => ({
  state: jobServiceCircuitBreaker.state,
  failureCount: jobServiceCircuitBreaker.failureCount,
  maxFailures: jobServiceCircuitBreaker.maxFailures,
  cooldownMs: jobServiceCircuitBreaker.cooldownMs,
  openedAt: jobServiceCircuitBreaker.openedAt,
  lastFailureAt: jobServiceCircuitBreaker.lastFailureAt,
  lastSuccessAt: jobServiceCircuitBreaker.lastSuccessAt,
});

const resetCircuitBreaker = () => {
  jobServiceCircuitBreaker.state = 'closed';
  jobServiceCircuitBreaker.failureCount = 0;
  jobServiceCircuitBreaker.openedAt = null;
  jobServiceCircuitBreaker.lastFailureAt = null;
};

const recordCircuitSuccess = (payloadForCache = {}) => {
  resetCircuitBreaker();
  jobServiceCircuitBreaker.lastSuccessAt = Date.now();
  jobServiceCircuitBreaker.lastSuccessPayload = {
    jobs: Array.isArray(payloadForCache.jobs) ? payloadForCache.jobs : [],
    total: Number.isFinite(payloadForCache.total)
      ? payloadForCache.total
      : Array.isArray(payloadForCache.jobs)
        ? payloadForCache.jobs.length
        : 0,
    metadata: {
      ...(payloadForCache.metadata || {}),
    },
  };
};

const openCircuit = () => {
  jobServiceCircuitBreaker.state = 'open';
  jobServiceCircuitBreaker.openedAt = Date.now();
};

const recordCircuitFailure = () => {
  jobServiceCircuitBreaker.failureCount += 1;
  jobServiceCircuitBreaker.lastFailureAt = Date.now();

  if (jobServiceCircuitBreaker.state === 'half-open') {
    jobServiceCircuitBreaker.failureCount = jobServiceCircuitBreaker.maxFailures;
  }

  if (jobServiceCircuitBreaker.failureCount >= jobServiceCircuitBreaker.maxFailures) {
    if (jobServiceCircuitBreaker.state !== 'open') {
      logger.warn('⚠️ Job service circuit opened after repeated failures');
    }
    openCircuit();
  }
};

const circuitShouldBlockRequest = () => {
  if (jobServiceCircuitBreaker.state !== 'open') {
    return false;
  }

  if (!jobServiceCircuitBreaker.openedAt) {
    return false;
  }

  const elapsed = Date.now() - jobServiceCircuitBreaker.openedAt;
  if (elapsed >= jobServiceCircuitBreaker.cooldownMs) {
    // Allow a test request (half-open) to see if service recovered
    jobServiceCircuitBreaker.state = 'half-open';
    return false;
  }

  return true;
};

const respondWithCachedJobs = (res, reason, note, options = {}) => {
  const cachedPayload = jobServiceCircuitBreaker.lastSuccessPayload;
  if (cachedPayload && Array.isArray(cachedPayload.jobs)) {
    return res.status(200).json({
      success: true,
      data: {
        jobs: cachedPayload.jobs,
        total: cachedPayload.total,
        fallback: true,
        fallbackReason: reason,
        metadata: {
          ...(cachedPayload.metadata || {}),
          cached: true,
          cacheTimestamp: jobServiceCircuitBreaker.lastSuccessAt
            ? new Date(jobServiceCircuitBreaker.lastSuccessAt).toISOString()
            : null,
          source: 'job-service-cache',
          note: note || 'Using cached job matches while job service recovers.',
          circuitBreaker: getCircuitBreakerSnapshot(),
        },
      },
    });
  }

  const fallback = buildRecentJobsFallback({
    limit: options.limit,
    reason,
  });
  fallback.data.metadata = {
    ...(fallback.data.metadata || {}),
    note: note || 'Job service unavailable; fallback matches provided.',
    circuitBreaker: getCircuitBreakerSnapshot(),
  };

  return res.status(200).json(fallback);
};

const buildRecentJobsFallback = ({ limit = 10, reason = 'RECENT_JOBS_FALLBACK' } = {}) => {
  const receivedAt = new Date().toISOString();

  return {
    success: true,
    data: {
      jobs: [],
      total: 0,
      fallback: true,
      fallbackReason: reason,
      metadata: {
        source: 'user-service-empty-fallback',
        receivedAt,
        requestedLimit: parseInt(limit, 10) || 10,
      },
    },
  };
};

const normalizeRecentJobItem = (job = {}) => ({
  id: job._id?.toString() || job.id || null,
  _id: job._id?.toString() || job.id || null,
  title: toSafeString(job.title, 'Untitled Job'),
  description: toSafeString(job.description, ''),
  category: job.category || null,
  status: toSafeString(job.status || 'open', 'open'),
  visibility: toSafeString(job.visibility || 'public', 'public'),
  budget: Number(job.budget) || 0,
  currency: toSafeString(job.currency || 'GHS', 'GHS'),
  paymentType: job.paymentType || null,
  location: job.location || job.locationDetails || null,
  locationDetails: job.locationDetails || null,
  skills: Array.isArray(job.skills) ? job.skills : [],
  requirements: job.requirements || {},
  createdAt: toIsoString(job.createdAt),
  updatedAt: toIsoString(job.updatedAt),
  expiresAt: toIsoString(job.expiresAt),
  bidding: job.bidding || null,
  hirer: job.hirer
    ? {
        id: job.hirer._id?.toString?.() || job.hirer.id || null,
        _id: job.hirer._id?.toString?.() || job.hirer.id || null,
        firstName: job.hirer.firstName || '',
        lastName: job.hirer.lastName || '',
        profilePicture: job.hirer.profilePicture || job.hirer.profileImage || null,
        rating: Number(job.hirer.rating) || 0,
        companyName: job.hirer.companyName || job.hirer.businessName || null,
      }
    : null,
  recommendationSource: 'recent',
});

const toObjectIdOrNull = (value) => {
  if (!value) {
    return null;
  }

  try {
    if (mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
  } catch (error) {
    return null;
  }

  return null;
};

const ensureWorkerDocuments = async ({ workerId, lean = true }) => {
  if (!workerId) {
    return { userDoc: null, workerProfile: null };
  }

  await ensureConnection({
    timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
  });

  if (typeof modelsModule.loadModels === 'function') {
    try {
      modelsModule.loadModels();
    } catch (error) {
      logger.warn('loadModels failed while fetching worker documents:', error.message);
    }
  }

  const MongoUser = modelsModule.User;
  const WorkerProfileModel = modelsModule.WorkerProfile;

  if (!MongoUser) {
    throw new Error('User model not initialized');
  }

  const objectId = toObjectIdOrNull(workerId);
  const findUser = (query) =>
    lean ? MongoUser.findOne(query).lean({ getters: true }) : MongoUser.findOne(query);
  const findProfile = (query) =>
    WorkerProfileModel
      ? lean
        ? WorkerProfileModel.findOne(query).lean({ getters: true })
        : WorkerProfileModel.findOne(query)
      : null;

  let userDoc = objectId
    ? await findUser({ _id: objectId })
    : await findUser({ _id: workerId });

  let workerProfile = null;

  if (userDoc) {
    workerProfile = WorkerProfileModel
      ? await findProfile({ userId: userDoc._id })
      : null;
  } else if (WorkerProfileModel && objectId) {
    workerProfile = await findProfile({ _id: objectId });
    if (workerProfile) {
      userDoc = await findUser({ _id: workerProfile.userId });
    }
  }

  return { userDoc, workerProfile };
};

const getMutableWorkerProfile = async (userDoc) => {
  const WorkerProfileModel = modelsModule.WorkerProfile;
  if (!WorkerProfileModel) {
    throw new Error('WorkerProfile model not initialized');
  }

  let profile = await WorkerProfileModel.findOne({ userId: userDoc._id });
  if (!profile) {
    profile = new WorkerProfileModel({
      userId: userDoc._id,
      profession: userDoc.profession,
      title: userDoc.profession,
      headline: userDoc.profession,
      location: userDoc.location,
      bio: userDoc.bio,
      skills: userDoc.skills || [],
      specializations: userDoc.specializations || [],
      hourlyRate: userDoc.hourlyRate,
      currency: userDoc.currency,
      yearsOfExperience: userDoc.yearsOfExperience,
      availabilityStatus: userDoc.availabilityStatus,
      isVerified: userDoc.isVerified,
      profilePicture: userDoc.profilePicture,
    });
  }
  return profile;
};

const canMutateWorkerResource = (reqUser, targetUserId) => {
  if (!reqUser || !targetUserId) {
    return false;
  }

  if (['admin', 'staff'].includes(reqUser.role)) {
    return true;
  }

  return String(reqUser.id) === String(targetUserId);
};

const normalizeSkillEntries = (skillEntries = [], fallbackSkills = []) => {
  const structuredEntries = (skillEntries || []).map((entry = {}) => ({
    id: entry._id ? entry._id.toString() : undefined,
    name: entry.name || 'Untitled Skill',
    level: entry.level || 'Intermediate',
    category: entry.category || null,
    yearsOfExperience: Number.isFinite(entry.yearsOfExperience)
      ? entry.yearsOfExperience
      : null,
    verified: Boolean(entry.verified),
    description: entry.description || null,
    source: entry.source || 'worker-profile',
    lastUsedAt: entry.lastUsedAt || null,
    evidenceUrl: entry.evidenceUrl || null,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  }));

  const legacyEntries = (fallbackSkills || []).map((skill) => {
    if (typeof skill === 'string') {
      return {
        id: `legacy_${skill}`,
        name: skill,
        level: 'Intermediate',
        source: 'legacy-user-skills',
        verified: false,
      };
    }

    if (typeof skill === 'object' && skill !== null) {
      return {
        id: skill._id ? `legacy_${skill._id}` : undefined,
        name: skill.name || skill.skillName || 'Untitled Skill',
        level: skill.level || skill.skillLevel || 'Intermediate',
        source: 'legacy-user-skills',
        verified: Boolean(skill.verified),
      };
    }

    return null;
  }).filter(Boolean);

  return uniqBy([...structuredEntries, ...legacyEntries], (entry) =>
    entry.name ? entry.name.toLowerCase() : entry.id,
  );
};

const normalizeWorkHistoryEntries = (workHistory = []) =>
  (workHistory || []).map((entry = {}) => ({
    id: entry._id ? entry._id.toString() : undefined,
    role: entry.role || 'Professional',
    company: entry.company || null,
    employmentType: entry.employmentType || 'contract',
    location: entry.location || null,
    startDate: entry.startDate || null,
    endDate: entry.endDate || null,
    isCurrent: Boolean(entry.isCurrent),
    description: entry.description || null,
    highlights: Array.isArray(entry.highlights) ? entry.highlights : [],
    clientsServed: Array.isArray(entry.clientsServed) ? entry.clientsServed : [],
    technologies: Array.isArray(entry.technologies) ? entry.technologies : [],
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  }));

const formatPortfolioDocument = (doc = {}) => ({
  id: doc._id ? doc._id.toString() : undefined,
  workerProfileId: doc.workerProfileId ? doc.workerProfileId.toString() : undefined,
  title: doc.title,
  description: doc.description,
  projectType: doc.projectType || 'professional',
  primarySkillId: doc.primarySkillId ? doc.primarySkillId.toString() : null,
  skillsUsed: doc.skillsUsed || [],
  mainImage: doc.getMainImageUrl ? doc.getMainImageUrl() : doc.mainImage,
  images: doc.getAllImageUrls ? doc.getAllImageUrls() : doc.images || [],
  videos: doc.videos || [],
  documents: doc.documents || [],
  projectValue: doc.projectValue || null,
  currency: doc.currency || 'GHS',
  startDate: doc.startDate || null,
  endDate: doc.endDate || null,
  location: doc.location || null,
  clientRating: doc.clientRating || null,
  status: doc.status || 'draft',
  isFeatured: Boolean(doc.isFeatured),
  viewCount: doc.viewCount || 0,
  likeCount: doc.likeCount || 0,
  sortOrder: doc.sortOrder || null,
  tags: doc.tags || [],
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const formatCertificateDocument = (doc = {}) => ({
  id: doc._id ? doc._id.toString() : undefined,
  name: doc.name,
  issuer: doc.issuer,
  credentialId: doc.credentialId || null,
  url: doc.url || null,
  issuedAt: doc.issuedAt || null,
  expiresAt: doc.expiresAt || null,
  status: doc.status || 'draft',
  verification: doc.verification || null,
  metadata: doc.metadata || {},
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const mapAvailableHours = (availableHours) => {
  if (!availableHours) {
    return [];
  }

  const entries = availableHours instanceof Map
    ? Array.from(availableHours.entries())
    : typeof availableHours === 'object'
      ? Object.entries(availableHours)
      : [];

  return entries
    .map(([day, value]) => {
      const start = toSafeString(value?.start, null);
      const end = toSafeString(value?.end, null);
      const normalisedDay = toSafeString(day, '').toLowerCase();

      if (!normalisedDay || !start || !end) {
        return null;
      }

      return {
        day: normalisedDay,
        start,
        end,
        available: toSafeBoolean(value?.available, true),
      };
    })
    .filter(Boolean);
};

const mapDaySlots = (daySlots) => {
  if (!Array.isArray(daySlots)) {
    return [];
  }

  return daySlots
    .map((slot) => {
      const dayOfWeek = typeof slot?.dayOfWeek === 'number' ? slot.dayOfWeek : null;

      if (isNil(dayOfWeek)) {
        return null;
      }

      const slots = Array.isArray(slot?.slots)
        ? slot.slots
          .map((timeSlot) => {
            const start = toSafeString(timeSlot?.start, null);
            const end = toSafeString(timeSlot?.end, null);
            if (!start || !end) {
              return null;
            }
            return { start, end };
          })
          .filter(Boolean)
        : [];

      return {
        dayOfWeek,
        slots,
      };
    })
    .filter(Boolean);
};

const mapPortfolioDoc = (item) => {
  if (!item) {
    return null;
  }

  const images = toArray(item.images).map((image) =>
    typeof image === 'object' ? toSafeString(image.url, '') : toSafeString(image, '')
  ).filter(Boolean);

  const skillsUsed = uniqBy(
    toArray(item.skillsUsed).map((skill) => toSafeString(skill, '').trim()).filter(Boolean),
    (skill) => skill
  );

  return {
    id: toSafeString(item._id || item.id, ''),
    title: toSafeString(item.title, ''),
    description: toSafeString(item.description, ''),
    projectType: toSafeString(item.projectType, 'professional'),
    status: toSafeString(item.status, 'draft'),
    isFeatured: toSafeBoolean(item.isFeatured, false),
    isActive: toSafeBoolean(item.isActive, true),
    completedAt: toIsoString(item.endDate || item.completedAt),
    clientName: toSafeString(item.clientName, ''),
    metrics: {
      projectValue: isNil(item.projectValue) ? null : toSafeNumber(item.projectValue, null),
      currency: toSafeString(item.currency, 'GHS'),
      viewCount: toSafeNumber(item.viewCount, 0),
      likeCount: toSafeNumber(item.likeCount, 0),
      shareCount: toSafeNumber(item.shareCount, 0),
    },
    skillsUsed,
    images,
    source: 'portfolioCollection',
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
};

const mapEmbeddedPortfolioItem = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const skills = uniqBy(
    toArray(item.skills).map((skill) => toSafeString(skill, '').trim()).filter(Boolean),
    (skill) => skill
  );

  return {
    id: toSafeString(item._id || item.id, '') || `embedded-portfolio-${index}`,
    title: toSafeString(item.title, ''),
    description: toSafeString(item.description, ''),
    projectType: toSafeString(item.projectType, 'professional'),
    status: toSafeString(item.status, 'published'),
    isFeatured: toSafeBoolean(item.isFeatured, false),
    isActive: toSafeBoolean(item.isActive, true),
    completedAt: toIsoString(item.completedAt),
    clientName: toSafeString(item.client, ''),
    metrics: {
      projectValue: isNil(item.projectValue) ? null : toSafeNumber(item.projectValue, null),
      currency: toSafeString(item.currency, 'GHS'),
      viewCount: toSafeNumber(item.viewCount, 0),
      likeCount: toSafeNumber(item.likeCount, 0),
      shareCount: toSafeNumber(item.shareCount, 0),
    },
    skillsUsed: skills,
    images: toArray(item.images).map((image) => toSafeString(image?.url || image, '')).filter(Boolean),
    source: 'profileEmbedded',
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
};

const mapCertificateDoc = (doc) => {
  if (!doc) {
    return null;
  }

  return {
    id: toSafeString(doc._id || doc.id, ''),
    name: toSafeString(doc.name, ''),
    issuer: toSafeString(doc.issuer, ''),
    credentialId: toSafeString(doc.credentialId, ''),
    issueDate: toIsoString(doc.issuedAt || doc.issueDate),
    expiryDate: toIsoString(doc.expiresAt || doc.expiryDate),
    status: toSafeString(doc.status, 'pending'),
    verification: {
      result: toSafeString(doc.verification?.result || (doc.status === 'verified' ? 'verified' : 'pending'), 'pending'),
      verifiedAt: toIsoString(doc.verification?.verifiedAt),
      requestedAt: toIsoString(doc.verification?.requestedAt),
      verifier: toSafeString(doc.verification?.verifier, ''),
      notes: toSafeString(doc.verification?.notes, ''),
    },
    links: {
      url: toSafeString(doc.url, ''),
      shareToken: toSafeString(doc.shareToken, ''),
      verificationUrl: toSafeString(doc.verification?.url || doc.metadata?.verificationUrl, ''),
    },
    metadata: doc.metadata || {},
    source: 'certificateCollection',
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
};

const mapEmbeddedCertificate = (item, index = 0) => {
  if (!item) {
    return null;
  }

  return {
    id: toSafeString(item._id || item.id, '') || `embedded-cert-${index}`,
    name: toSafeString(item.name, ''),
    issuer: toSafeString(item.issuer, ''),
    credentialId: toSafeString(item.credentialId, ''),
    issueDate: toIsoString(item.issueDate),
    expiryDate: toIsoString(item.expiryDate),
    status: toSafeString(item.status || item.verificationStatus, 'pending'),
    verification: {
      result: toSafeString(item.verification?.result || item.verificationStatus, 'pending'),
      verificationUrl: toSafeString(item.verificationUrl, ''),
    },
    links: {
      url: toSafeString(item.verificationUrl, ''),
    },
    source: 'profileEmbedded',
  };
};

const buildAvailabilitySection = (availabilityDoc, profile, worker) => {
  const status = toSafeString(profile?.availabilityStatus || worker?.availabilityStatus, 'available');

  const isAvailable = toSafeBoolean(
    !isNil(availabilityDoc?.isAvailable)
      ? availabilityDoc?.isAvailable
      : !isNil(profile?.isAvailable)
        ? profile?.isAvailable
        : status === 'available',
    true,
  );

  const schedule = toArray(availabilityDoc?.schedule).map((entry) => ({
    start: toIsoString(entry?.start),
    end: toIsoString(entry?.end),
    status: toSafeString(entry?.status, ''),
  })).filter((entry) => entry.start || entry.end || entry.status);

  return {
    status,
    isAvailable,
    timezone: toSafeString(availabilityDoc?.timezone || profile?.timezone, 'Africa/Accra'),
    daySlots: mapDaySlots(availabilityDoc?.daySlots),
    availableHours: mapAvailableHours(profile?.availableHours),
    schedule,
    nextAvailable: toIsoString(availabilityDoc?.nextAvailable),
    message: toSafeString(availabilityDoc?.message || profile?.availabilityMessage, ''),
    pausedUntil: toIsoString(availabilityDoc?.pausedUntil || profile?.pausedUntil),
    lastUpdated: toIsoString(availabilityDoc?.updatedAt || profile?.updatedAt || worker?.updatedAt),
    emergencyAvailable: toSafeBoolean(profile?.emergencyAvailable, false),
    notes: toSafeString(availabilityDoc?.notes, ''),
    source: {
      availability: Boolean(availabilityDoc),
      workerProfile: Boolean(profile && (profile.availabilityStatus || profile.availableHours)),
    },
  };
};

const buildStats = (worker = {}, profile = {}) => {
  const rating = !isNil(profile.rating) ? profile.rating : worker.rating;
  const totalReviews = !isNil(profile.totalReviews) ? profile.totalReviews : worker.totalReviews;
  const totalJobsCompleted = !isNil(profile.totalJobsCompleted) ? profile.totalJobsCompleted : worker.totalJobsCompleted;
  const totalJobs = !isNil(profile.totalJobs) ? profile.totalJobs : worker.totalJobsCompleted;

  return {
    rating: toSafeNumber(rating, 0),
    totalReviews: toSafeNumber(totalReviews, 0),
    totalJobsCompleted: toSafeNumber(totalJobsCompleted, 0),
    totalJobs: toSafeNumber(totalJobs, 0),
    completionRate: toSafeNumber(profile.profileCompleteness ?? profile.completionRate, 0),
    responseRate: toSafeNumber(profile.responseRate, 0),
    profileViews: toSafeNumber(profile.profileViews, 0),
    totalEarnings: toSafeNumber(profile.totalEarnings, 0),
    averageResponseTime: toSafeNumber(profile.averageResponseTime, 0),
  };
};

const buildVerificationSnapshot = (worker = {}, profile = {}, certificationSummary = {}) => {
  const isVerified = toSafeBoolean(
    !isNil(profile.isVerified) ? profile.isVerified : worker.isVerified,
    false,
  );

  return {
    isVerified,
    verificationLevel: toSafeString(
      profile.verificationLevel || (isVerified ? 'basic' : 'none'),
      'none',
    ),
    backgroundCheckStatus: toSafeString(profile.backgroundCheckStatus, 'not_required'),
    verifiedCertificates: certificationSummary.verifiedCount || 0,
    totalCertificates: certificationSummary.total || 0,
    lastReviewedAt: toIsoString(profile.updatedAt || worker.updatedAt),
  };
};

const canViewWorkerPrivateFields = (reqUser, targetUserId) =>
  canMutateWorkerResource(reqUser, targetUserId);

const buildPublicAvailabilityView = (availability = {}) => ({
  status: availability.status || 'available',
  isAvailable: toSafeBoolean(availability.isAvailable, true),
  timezone: toSafeString(availability.timezone, 'Africa/Accra'),
  nextAvailable: availability.nextAvailable || null,
  message: toSafeString(availability.message, ''),
  emergencyAvailable: toSafeBoolean(availability.emergencyAvailable, false),
  lastUpdated: availability.lastUpdated || null,
  source: availability.source || {},
});

const sanitizeWorkerResponseForAudience = (workerPayload, options = {}) => {
  const { includePrivateFields = false } = options;
  if (!workerPayload) {
    return workerPayload;
  }

  if (includePrivateFields) {
    return workerPayload;
  }

  return {
    ...workerPayload,
    availability: buildPublicAvailabilityView(workerPayload.availability),
    certifications: {
      ...workerPayload.certifications,
      items: toArray(workerPayload.certifications?.items).filter((certificate) => {
        const status = toSafeString(certificate?.status, '').toLowerCase();
        const verificationResult = toSafeString(certificate?.verification?.result, '').toLowerCase();
        return status === 'verified' || verificationResult === 'verified';
      }),
    },
  };
};

const isDbUnavailableError = (error) => {
  if (!error) {
    return false;
  }

  const name = String(error.name || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();
  if (
    name.includes('mongonetworkerror') ||
    name.includes('mongooseerror') ||
    name.includes('mongoerror') ||
    name.includes('mongoosetimeouts') ||
    code === 'etimedout' ||
    code === 'ecancelled'
  ) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('timed out waiting for mongodb connection') ||
    message.includes('mongodb connection failed to reach ready state') ||
    message.includes('failed to connect to server') ||
    message.includes('topology was destroyed')
  );
};

class WorkerController {
  /**
   * Get all workers with filtering and pagination - FIXED to use MongoDB
   */
  static async getAllWorkers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        city,
        location,
        primaryTrade,
        workType,
        skills,
        rating,
        availability,
        maxRate,
        verified,
        search,
        keywords, // NEW: Text search
        latitude,
        longitude,
        radius,
      } = req.query;

      const searchTerm = keywords || search || '';
      const { workers, pagination } = await executeWorkerDirectoryQuery({
        page,
        limit,
        textQuery: searchTerm,
        locationText: city || location || '',
        primaryTrade,
        workType,
        skillsList: normalizeDelimitedList(skills),
        minRating: Number(rating || 0),
        maxRate: maxRate ? Number(maxRate) : undefined,
        availability,
        verified: verified === 'true',
        sortBy: req.query.sortBy || 'relevance',
        latitude,
        longitude,
        radius,
      });

      const formattedWorkers = workers.map((worker) => ({
        ...worker,
        skills: (worker.skills || []).map((skill) => {
          if (typeof skill === 'string') {
            return {
              name: skill,
              level: 'Intermediate',
            };
          }

          if (skill && typeof skill === 'object') {
            return {
              ...skill,
              name: skill.name || skill.skillName || skill.label || '',
              level: skill.level || 'Intermediate',
            };
          }

          return {
            name: String(skill || ''),
            level: 'Intermediate',
          };
        }).filter((skill) => skill.name),
      }));

      return res.status(200).json({
        success: true,
        message: 'Workers retrieved successfully',
        data: {
          // Keep both keys during transition so existing consumers stay stable.
          items: formattedWorkers,
          workers: formattedWorkers,
          pagination,
        },
        meta: {
          pagination,
        },
      });
    } catch (error) {
      logger.error('❌ Error in getAllWorkers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch workers'
      });
    }
  }

  static async searchWorkers(req, res) {
    try {
      const {
        query = '',
        location,
        skills,
        minRating = 0,
        maxRate,
        availability,
        radius = 50,
        latitude,
        longitude,
        page = 1,
        limit = 20,
        sortBy = 'relevance'
      } = req.query;

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

      const { workers: searchResults, pagination } = await executeWorkerDirectoryQuery({
        page: parsedPage,
        limit: parsedLimit,
        textQuery: query,
        locationText: location || '',
        skillsList: normalizeDelimitedList(skills),
        minRating: Number(minRating || 0),
        maxRate: maxRate ? Number(maxRate) : undefined,
        availability,
        sortBy,
        latitude,
        longitude,
        radius,
      });

      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          workers: searchResults,
          pagination,
          searchParams: {
            query,
            location,
            skills,
            minRating,
            maxRate,
            radius
          }
        }
      });

    } catch (error) {
      logger.error('Search workers error:', error);
      if (error?.message?.toLowerCase().includes('timed out waiting for mongodb connection')) {
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_DB_NOT_READY'
        });
      }
      return handleServiceError(res, error, 'Search failed');
    }
  }


      static async getTradeCategoryStats(req, res) {
        try {
          const categories = await executeTradeCategoryStatsQuery();

          return res.status(200).json({
            success: true,
            message: 'Trade category stats retrieved successfully',
            data: {
              categories,
            },
          });
        } catch (error) {
          logger.error('Trade category stats error:', error);

          if (error?.message?.toLowerCase().includes('timed out waiting for mongodb connection')) {
            return res.status(503).json({
              success: false,
              message: 'User Service database is reconnecting. Please try again shortly.',
              code: 'USER_DB_NOT_READY',
            });
          }

          return handleServiceError(res, error, 'Failed to retrieve trade category stats');
        }
      }
  static async getWorkerById(req, res) {
    const workerId = req.params.id;

    try {
      if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid worker ID required',
          code: 'INVALID_WORKER_ID',
        });
      }

      if (mongoose.connection.readyState !== 1) {
        logger.warn('⚠️ MongoDB not ready for getWorkerById request');
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_SERVICE_DB_NOT_READY',
        });
      }

      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      const MongoUser = modelsModule.User;
      const MongoWorkerProfile = modelsModule.WorkerProfile;

      if (!MongoUser) {
        logger.error('❌ User model not available');
        return res.status(503).json({
          success: false,
          message: 'User model not initialized',
          code: 'USER_MODEL_UNAVAILABLE',
        });
      }

      const [workerDoc, workerProfileDoc] = await Promise.all([
        MongoUser.findById(workerId)
          .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationToken -twoFactorSecret -__v -email -phone -address -dateOfBirth -gender -googleId -facebookId -linkedinId -failedLoginAttempts -lockUntil')
          .lean()
          .catch((err) => {
            logger.error('❌ Error querying User:', err);
            return null;
          }),
        MongoWorkerProfile
          ? MongoWorkerProfile.findOne({ userId: workerId })
            .lean()
            .catch((err) => {
              logger.error('⚠️ Error querying WorkerProfile:', err);
              return null;
            })
          : null,
      ]);

      if (!workerDoc && !workerProfileDoc) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          code: 'WORKER_NOT_FOUND',
        });
      }

      if (workerDoc && (workerDoc.role !== 'worker' || workerDoc.isActive === false || workerDoc.deletedAt)) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          code: 'NOT_AN_ACTIVE_WORKER',
        });
      }

      const workerProfileId = workerProfileDoc?._id;

      const [availabilityDoc, certificateDocs, portfolioDocs] = await Promise.all([
        modelsModule.Availability
          ? modelsModule.Availability.findOne({ user: workerId })
            .lean()
            .catch((err) => {
              logger.error('⚠️ Error querying Availability:', err);
              return null;
            })
          : null,
        modelsModule.Certificate
          ? modelsModule.Certificate.find({ workerId, status: { $ne: 'archived' } })
            .sort({ status: -1, createdAt: -1 })
            .limit(25)
            .lean()
            .catch((err) => {
              logger.error('⚠️ Error querying Certificates:', err);
              return [];
            })
          : [],
        workerProfileId && modelsModule.Portfolio
          ? modelsModule.Portfolio.find({
            workerProfileId,
            isActive: true,
            status: { $ne: 'archived' },
          })
            .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
            .limit(20)
            .lean()
            .catch((err) => {
              logger.error('⚠️ Error querying Portfolio:', err);
              return [];
            })
          : [],
      ]);

      const worker = workerDoc || {};
      const profile = workerProfileDoc || {};

      const skills = uniqBy(
        [
          ...toArray(worker.skills).map((skill) => normalizeSkill(skill, 'user')),
          ...toArray(profile.skills).map((skill) => normalizeSkill(skill, 'profile')),
        ].filter(Boolean),
        (skill) => skill.name.toLowerCase(),
      );

      const specializations = uniqBy(
        [
          ...toArray(worker.specializations).map((item) => toSafeString(item, '').trim()).filter(Boolean),
          ...toArray(profile.specializations).map((item) => toSafeString(item, '').trim()).filter(Boolean),
        ],
        (item) => item.toLowerCase(),
      );

      const languages = uniqBy(
        toArray(profile.languages).map((item) => toSafeString(item, '').trim()).filter(Boolean),
        (lang) => lang.toLowerCase(),
      );

      const embeddedPortfolio = toArray(profile.portfolioItems)
        .map((item, index) => mapEmbeddedPortfolioItem(item, index))
        .filter(Boolean);

      const collectedPortfolio = toArray(portfolioDocs)
        .map((item) => mapPortfolioDoc(item))
        .filter(Boolean);

      const combinedPortfolio = uniqBy(
        [...embeddedPortfolio, ...collectedPortfolio],
        (item) => item.id || `${item.title}-${item.completedAt || item.createdAt || ''}`,
      );

      const embeddedCertificates = toArray(profile.certifications)
        .map((item, index) => mapEmbeddedCertificate(item, index))
        .filter(Boolean);

      const collectedCertificates = toArray(certificateDocs)
        .map((item) => mapCertificateDoc(item))
        .filter(Boolean);

      const combinedCertificates = uniqBy(
        [...collectedCertificates, ...embeddedCertificates],
        (item) => item.id || `${item.name}-${item.issueDate || ''}`,
      );

      const certificationSummary = {
        items: combinedCertificates.slice(0, 20),
        total: combinedCertificates.length,
        verifiedCount: combinedCertificates.filter((cert) => {
          const status = toSafeString(cert.status, '').toLowerCase();
          const result = toSafeString(cert.verification?.result, '').toLowerCase();
          return status === 'verified' || result === 'verified';
        }).length,
      };

      const portfolioSummary = {
        items: combinedPortfolio.slice(0, 20),
        total: combinedPortfolio.length,
        featured: combinedPortfolio.filter((item) => item.isFeatured).slice(0, 5),
      };

      const stats = buildStats(worker, profile);

      const rate = {
        amount: !isNil(profile.hourlyRate) ? toSafeNumber(profile.hourlyRate, null) : toSafeNumber(worker.hourlyRate, null),
        min: toSafeNumber(profile.hourlyRateMin, null),
        max: toSafeNumber(profile.hourlyRateMax, null),
        currency: toSafeString(profile.currency || worker.currency, 'GHS'),
      };

      const hourlyRateValue = !isNil(rate.amount) && Number.isFinite(rate.amount)
        ? rate.amount
        : !isNil(rate.min) && Number.isFinite(rate.min)
          ? rate.min
          : !isNil(rate.max) && Number.isFinite(rate.max)
            ? rate.max
            : 0;

      const availability = buildAvailabilitySection(availabilityDoc, profile, worker);

      const verification = buildVerificationSnapshot(worker, profile, certificationSummary);

      const targetWorkerId = worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, '');
      const includePrivateFields = canViewWorkerPrivateFields(req.user, targetWorkerId);

      const workerPayload = {
        id: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
        userId: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
        name: `${toSafeString(worker.firstName)} ${toSafeString(worker.lastName)}`.trim() || 'Worker',
        firstName: toSafeString(worker.firstName, ''),
        lastName: toSafeString(worker.lastName, ''),
        bio: toSafeString(profile.bio || worker.bio, `Professional worker in ${worker.location || 'Ghana'}.`),
        tagline: toSafeString(profile.tagline || profile.headline, ''),
        location: toSafeString(profile.location || worker.location, 'Ghana'),
        city: toSafeString(profile.location || worker.location, 'Accra').split(',')[0].trim(),
        country: toSafeString(profile.country || worker.country || 'Ghana', 'Ghana'),
        hourlyRate: hourlyRateValue,
        rate,
        currency: rate.currency,
        rating: stats.rating,
        totalReviews: stats.totalReviews,
        totalJobsCompleted: stats.totalJobsCompleted,
        availabilityStatus: toSafeString(profile.availabilityStatus || worker.availabilityStatus, 'available'),
        isVerified: verification.isVerified,
        profilePicture: worker.profilePicture || profile.profilePicture || null,
        bannerImage: profile.bannerImage || null,
        specializations,
        profession: toSafeString(worker.profession || profile.profession, 'General Worker'),
        workType: toSafeString(profile.workType || 'Full-time'),
        skills,
        languages,
        stats,
        verification,
        availability,
        experience: {
          level: toSafeString(profile.experienceLevel, ''),
          years: toSafeNumber(!isNil(profile.yearsOfExperience) ? profile.yearsOfExperience : worker.yearsOfExperience, 0),
          preferredJobTypes: toArray(profile.preferredJobTypes).map((item) => toSafeString(item, '')).filter(Boolean),
          workingHoursPreference: toSafeString(profile.workingHoursPreference, ''),
          travelWillingness: toSafeString(profile.travelWillingness, ''),
          emergencyAvailable: toSafeBoolean(profile.emergencyAvailable, false),
        },
        portfolio: portfolioSummary,
        certifications: certificationSummary,
        contact: includePrivateFields
          ? {
            email: req.user ? toSafeString(worker.email, '') : undefined,
            phone: req.user ? toSafeString(worker.phone, '') : undefined,
            website: toSafeString(profile.website || worker.website, ''),
            social: {
              linkedin: toSafeString(profile.linkedinUrl || profile.socialLinks?.linkedin, ''),
              instagram: toSafeString(profile.socialLinks?.instagram, ''),
              facebook: toSafeString(profile.socialLinks?.facebook, ''),
            },
          }
          : {
            website: toSafeString(profile.website || worker.website, ''),
            social: {
              linkedin: toSafeString(profile.linkedinUrl || profile.socialLinks?.linkedin, ''),
              instagram: toSafeString(profile.socialLinks?.instagram, ''),
              facebook: toSafeString(profile.socialLinks?.facebook, ''),
            },
          },
        business: includePrivateFields && profile.businessInfo
          ? {
            name: toSafeString(profile.businessInfo.businessName, ''),
            type: toSafeString(profile.businessInfo.businessType, ''),
            registrationNumber: toSafeString(profile.businessInfo.registrationNumber, ''),
            taxId: toSafeString(profile.businessInfo.taxId, ''),
          }
          : null,
        insurance: includePrivateFields && profile.insuranceInfo
          ? {
            hasInsurance: toSafeBoolean(profile.insuranceInfo.hasInsurance, false),
            provider: toSafeString(profile.insuranceInfo.provider, ''),
            expiryDate: toIsoString(profile.insuranceInfo.expiryDate),
            coverage: toSafeNumber(profile.insuranceInfo.coverage, null),
          }
          : null,
        user: includePrivateFields
          ? {
            id: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
            email: req.user ? toSafeString(worker.email, '') : undefined,
            phone: req.user ? toSafeString(worker.phone, '') : undefined,
            role: toSafeString(worker.role, 'worker'),
            isActive: toSafeBoolean(worker.isActive, true),
            isEmailVerified: toSafeBoolean(worker.isEmailVerified, false),
            createdAt: toIsoString(worker.createdAt),
            updatedAt: toIsoString(worker.updatedAt),
            lastLogin: toIsoString(worker.lastLogin),
          }
          : {
            id: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
            role: toSafeString(worker.role, 'worker'),
          },
        lastActiveAt: includePrivateFields ? toIsoString(profile.lastActiveAt || worker.lastLogin) : null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          source: {
            user: Boolean(workerDoc),
            workerProfile: Boolean(workerProfileDoc),
            availability: Boolean(availabilityDoc),
            portfolio: combinedPortfolio.length > 0,
            certifications: combinedCertificates.length > 0,
          },
        },
      };

      workerPayload.rankScore = scoreWorker({
        rating: stats.rating,
        totalJobsCompleted: stats.totalJobsCompleted,
        isVerified: verification.isVerified,
      });

      const responseWorkerPayload = sanitizeWorkerResponseForAudience(workerPayload, {
        includePrivateFields,
      });

      return res.status(200).json({
        success: true,
        data: {
          worker: responseWorkerPayload,
        },
      });

    } catch (error) {
      logger.error('❌ getWorkerById FATAL ERROR:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        workerId,
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching worker profile',
        code: 'INTERNAL_SERVER_ERROR',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get profile completion percentage for a worker
   */
  static async getProfileCompletion(req, res) {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid worker ID required',
      });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildProfileFallbackPayload(reason),
      });

    if (mongoose.connection.readyState !== 1) {
      logger.warn('⚠️ MongoDB not ready for profile completeness request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoWorkerProfile = modelsModule.WorkerProfile;

      if (!MongoUser) {
        return res.status(503).json({
          success: false,
          message: 'User model not initialized',
        });
      }

      const [worker, workerProfile] = await Promise.all([
        MongoUser.findById(workerId)
          .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -phoneVerificationToken -twoFactorSecret -__v -email -phone -address -dateOfBirth -gender -googleId -facebookId -linkedinId -failedLoginAttempts -lockUntil')
          .lean(),
        MongoWorkerProfile ? MongoWorkerProfile.findOne({ userId: workerId }).lean() : null,
      ]);

      if (!worker && !workerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      const normalizeArray = (value) => {
        if (Array.isArray(value)) {
          return value.filter((item) => item !== null && item !== undefined);
        }
        return [];
      };

      const combined = {
        ...(worker || {}),
        ...(workerProfile || {}),
        // Explicit precedence rules for overlapping fields
        bio: worker?.bio ?? workerProfile?.bio ?? '',
        location: worker?.location ?? workerProfile?.location ?? '',
        hourlyRate:
          worker?.hourlyRate ??
          workerProfile?.hourlyRate ??
          workerProfile?.hourlyRateMin ??
          workerProfile?.hourlyRateMax ?? null,
        skills: normalizeArray(
          (Array.isArray(worker?.skills) && worker?.skills.length > 0
            ? worker.skills
            : workerProfile?.skills) || [],
        ),
        profilePicture: worker?.profilePicture ?? workerProfile?.profilePicture ?? null,
        certifications: normalizeArray(
          (workerProfile?.certifications && workerProfile.certifications.length
            ? workerProfile.certifications
            : worker?.certifications) || [],
        ),
        portfolio: normalizeArray(
          (workerProfile?.portfolioItems && workerProfile.portfolioItems.length
            ? workerProfile.portfolioItems
            : worker?.portfolio) || [],
        ),
        yearsOfExperience: worker?.yearsOfExperience ?? workerProfile?.yearsOfExperience ?? null,
        profession: worker?.profession ?? workerProfile?.profession ?? '',
        phone: worker?.phone ?? workerProfile?.phone ?? '',
        website: worker?.website ?? workerProfile?.website ?? '',
      };

      const getFieldValue = (field) => {
        switch (field) {
          case 'portfolio':
            return combined.portfolio;
          case 'certifications':
            return combined.certifications;
          case 'skills':
            return combined.skills;
          default:
            return combined[field];
        }
      };

      const hasValue = (value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (value && typeof value === 'object') {
          return Object.keys(value).length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      };

      // Calculate completion percentage based on profile fields
      let completedRequired = 0;
      let completedOptional = 0;

      // Check required fields
      REQUIRED_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedRequired++;
        }
      });

      // Check optional fields
      OPTIONAL_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedOptional++;
        }
      });

      const requiredPercentage = (completedRequired / REQUIRED_PROFILE_FIELDS.length) * 70; // 70% weight
      const optionalPercentage = (completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 30; // 30% weight
      const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

      // Determine missing fields
      const missingRequired = REQUIRED_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const missingOptional = OPTIONAL_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const recommendations = [];
      if (missingRequired.includes('bio')) {
        recommendations.push('Complete your professional bio');
      }
      if (missingRequired.includes('profilePicture')) {
        recommendations.push('Add your profile picture');
      }
      if (missingOptional.includes('certifications')) {
        recommendations.push('List your certifications');
      }
      if (missingOptional.includes('portfolio')) {
        recommendations.push('Update your portfolio');
      }
      if (recommendations.length === 0 && totalPercentage < 100) {
        recommendations.push('Review your profile details to reach 100% completion');
      }

      return res.json({
        success: true,
        data: {
          completionPercentage: totalPercentage,
          requiredCompletion: Math.round((completedRequired / REQUIRED_PROFILE_FIELDS.length) * 100),
          optionalCompletion: Math.round((completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 100),
          missingRequired,
          missingOptional,
          recommendations,
          source: {
            user: !!worker,
            workerProfile: !!workerProfile,
          },
        }
      });

    } catch (error) {
      logger.error('❌ ERROR in getProfileCompletion - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        userModelLoaded: !!modelsModule?.User,
        workerProfileModelLoaded: !!modelsModule?.WorkerProfile,
        connectionState: mongoose.connection.readyState
      });
      if (error?.name === 'BSONVersionError') {
        logger.warn('⚠️ BSON version mismatch detected in getProfileCompletion, serving fallback payload');
        return sendFallback('BSON_VERSION_MISMATCH');
      }
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      return handleServiceError(res, error, 'Failed to get profile completion');
    }
  }

  /**
   * Get recent jobs for workers
   */
  static async getRecentJobs(req, res) {
    try {
      const { limit = 10 } = req.query;
      const normalizedLimit = Math.min(parseInt(limit, 10) || 10, 12);
      const parseGatewayUser = async () => {
        if (req.user?.id) {
          return req.user;
        }

        const gatewayHeader = req.headers['x-authenticated-user'];
        if (gatewayHeader) {
          try {
            const parsed = JSON.parse(gatewayHeader);
            if (parsed && parsed.id) {
              return parsed;
            }
          } catch (error) {
            logger.warn('Failed to parse x-authenticated-user header:', error.message);
          }
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          try {
            const decoded = await verifyAccessToken(token);
            const claims = decodeUserFromClaims(decoded);
            if (claims?.id) {
              return claims;
            }
          } catch (error) {
            logger.warn('Unable to decode authorization token for recent jobs:', error.message);
          }
        }

        return null;
      };

      const userContext = await parseGatewayUser();
      const userId = userContext?.id;

      if (!userId) {
        logger.warn('Recent jobs request missing authenticated user context; rejecting request');
        return res.status(401).json({
          success: false,
          message: 'Authenticated user context required',
          code: 'MISSING_AUTH_CONTEXT',
        });
      }

      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      if (typeof modelsModule.loadModels === 'function') {
        modelsModule.loadModels();
      }

      const JobModel = modelsModule.Job;
      const ApplicationModel = modelsModule.Application;

      if (!JobModel) {
        const fallback = buildRecentJobsFallback({
          limit: normalizedLimit,
          reason: 'JOB_MODEL_UNAVAILABLE',
        });
        fallback.data.metadata = {
          ...(fallback.data.metadata || {}),
          source: 'user-service-fallback',
        };
        return res.status(200).json(fallback);
      }

      const appliedJobIds = ApplicationModel
        ? await ApplicationModel.find({ worker: userId }).distinct('job')
        : [];

      const jobs = await JobModel.find({
        status: { $in: ['open', 'Open'] },
        $and: [
          {
            $or: [
              { visibility: 'public' },
              { visibility: { $exists: false } },
              { visibility: null },
            ],
          },
          ...(appliedJobIds.length > 0 ? [{ _id: { $nin: appliedJobIds } }] : []),
        ],
      })
        .populate('hirer', 'firstName lastName profilePicture profileImage rating companyName businessName')
        .sort({ createdAt: -1 })
        .limit(normalizedLimit)
        .lean();

      const normalizedJobs = jobs.map((job) => normalizeRecentJobItem(job));
      const metadata = {
        source: 'user-service-recent-jobs',
        receivedAt: new Date().toISOString(),
        requestedLimit: normalizedLimit,
      };

      return res.json({
        success: true,
        data: {
          jobs: normalizedJobs,
          total: normalizedJobs.length,
          metadata,
        },
      });
    } catch (error) {
      logger.error('Get recent jobs error:', error);
      return handleServiceError(res, error, 'Failed to get recent jobs');
    }
  }

  /**
   * Get structured skill entries for a worker profile
   */
  static async getWorkerSkills(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc && !workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const normalized = normalizeSkillEntries(
        workerProfile?.skillEntries,
        workerProfile?.skills || userDoc?.skills || [],
      );

      return res.json({
        success: true,
        data: {
          skills: normalized,
          totals: {
            count: normalized.length,
            verified: normalized.filter((entry) => entry.verified).length,
          },
          source: {
            workerProfile: Boolean(workerProfile),
            user: Boolean(userDoc),
          },
        },
      });
    } catch (error) {
      logger.error('getWorkerSkills error:', error);
      return handleServiceError(res, error, 'Failed to load worker skills');
    }
  }

  /**
   * Create a new worker skill entry
   */
  static async createWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];

      const now = new Date();
      profile.skillEntries.push({
        name: payload.name.trim(),
        level: payload.level || 'Intermediate',
        category: payload.category || null,
        yearsOfExperience: Number.isFinite(payload.yearsOfExperience)
          ? payload.yearsOfExperience
          : null,
        verified: Boolean(payload.verified && ['admin', 'staff'].includes(req.user?.role)),
        description: payload.description || null,
        source: payload.source || 'worker-self',
        lastUsedAt: payload.lastUsedAt || null,
        evidenceUrl: payload.evidenceUrl || null,
        createdAt: now,
        updatedAt: now,
      });

      await profile.save();
      const created = profile.skillEntries[profile.skillEntries.length - 1];
      const normalized = normalizeSkillEntries([
        created?.toObject ? created.toObject() : created,
      ])[0];

      return res.status(201).json({ success: true, data: { skill: normalized } });
    } catch (error) {
      logger.error('createWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to create worker skill');
    }
  }

  /**
   * Update an existing worker skill entry
   */
  static async updateWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const skillId = req.params.skillId;
    if (!workerId || !skillId) {
      return res.status(400).json({ success: false, message: 'workerId and skillId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];
      const entry = profile.skillEntries.id(skillId);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      const payload = req.body || {};
      if (payload.name) entry.name = payload.name.trim();
      if (payload.level) entry.level = payload.level;
      if (payload.category !== undefined) entry.category = payload.category;
      if (payload.description !== undefined) entry.description = payload.description;
      if (payload.yearsOfExperience !== undefined) entry.yearsOfExperience = Number.isFinite(payload.yearsOfExperience)
        ? payload.yearsOfExperience
        : entry.yearsOfExperience;
      if (payload.lastUsedAt !== undefined) entry.lastUsedAt = payload.lastUsedAt;
      if (payload.evidenceUrl !== undefined) entry.evidenceUrl = payload.evidenceUrl;
      if (payload.source) entry.source = payload.source;
      if (payload.verified !== undefined && ['admin', 'staff'].includes(req.user?.role)) {
        entry.verified = Boolean(payload.verified);
      }
      entry.updatedAt = new Date();

      await profile.save();
      const normalized = normalizeSkillEntries([
        entry?.toObject ? entry.toObject() : entry,
      ])[0];

      return res.json({ success: true, data: { skill: normalized } });
    } catch (error) {
      logger.error('updateWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to update worker skill');
    }
  }

  /**
   * Bulk upsert worker skill entries in a single request.
   * Replaces the previous N+1 client mutation pattern.
   */
  static async upsertWorkerSkillsBulk(req, res) {
    const MAX_WORKER_SKILL_ENTRIES = 50;
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const inputSkills = Array.isArray(req.body?.skills) ? req.body.skills : null;
    if (!inputSkills) {
      return res.status(400).json({ success: false, message: 'skills array is required' });
    }

    if (inputSkills.length > MAX_WORKER_SKILL_ENTRIES) {
      return res.status(422).json({
        success: false,
        message: `You can save up to ${MAX_WORKER_SKILL_ENTRIES} skills at a time`,
      });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];

      const now = new Date();
      const existingByName = new Map(
        profile.skillEntries
          .filter((entry) => entry?.name)
          .map((entry) => [String(entry.name).trim().toLowerCase(), entry]),
      );

      const nextEntries = [];
      inputSkills.forEach((rawSkill) => {
        const name = String(rawSkill?.name || rawSkill?.skillName || '').trim();
        if (!name) return;

        const key = name.toLowerCase();
        const existing = existingByName.get(key);

        const base = {
          name,
          level: rawSkill?.level || existing?.level || 'Intermediate',
          category: rawSkill?.category !== undefined ? rawSkill.category : (existing?.category || null),
          yearsOfExperience:
            rawSkill?.yearsOfExperience !== undefined && Number.isFinite(Number(rawSkill.yearsOfExperience))
              ? Number(rawSkill.yearsOfExperience)
              : (existing?.yearsOfExperience ?? null),
          description: rawSkill?.description !== undefined ? rawSkill.description : (existing?.description || null),
          source: rawSkill?.source || existing?.source || 'worker-self',
          lastUsedAt: rawSkill?.lastUsedAt !== undefined ? rawSkill.lastUsedAt : (existing?.lastUsedAt || null),
          evidenceUrl: rawSkill?.evidenceUrl !== undefined ? rawSkill.evidenceUrl : (existing?.evidenceUrl || null),
          verified:
            rawSkill?.verified !== undefined && ['admin', 'staff'].includes(req.user?.role)
              ? Boolean(rawSkill.verified)
              : Boolean(existing?.verified),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };

        if (existing?._id) {
          base._id = existing._id;
        }

        nextEntries.push(base);
      });

      profile.skillEntries = nextEntries;
      await profile.save();

      const normalized = normalizeSkillEntries(
        profile.skillEntries.map((entry) => (entry?.toObject ? entry.toObject() : entry)),
      );

      return res.json({
        success: true,
        data: {
          skills: normalized,
          totals: {
            count: normalized.length,
            verified: normalized.filter((entry) => entry.verified).length,
          },
        },
      });
    } catch (error) {
      logger.error('upsertWorkerSkillsBulk error:', error);
      return handleServiceError(res, error, 'Failed to update worker skills');
    }
  }

  /**
   * Delete a worker skill entry
   */
  static async deleteWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const skillId = req.params.skillId;
    if (!workerId || !skillId) {
      return res.status(400).json({ success: false, message: 'workerId and skillId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];
      const entry = profile.skillEntries.id(skillId);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      entry.remove();
      await profile.save();

      return res.status(204).send();
    } catch (error) {
      logger.error('deleteWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to delete worker skill');
    }
  }

  /**
   * Get worker work history entries
   */
  static async getWorkerWorkHistory(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc && !workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const entries = normalizeWorkHistoryEntries(workerProfile?.workHistory || []);
      return res.json({
        success: true,
        data: {
          workHistory: entries,
          totals: { count: entries.length },
          source: {
            workerProfile: Boolean(workerProfile),
          },
        },
      });
    } catch (error) {
      logger.error('getWorkerWorkHistory error:', error);
      return handleServiceError(res, error, 'Failed to load worker work history');
    }
  }

  /**
   * Add a work history entry for a worker
   */
  static async addWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    if (!payload.role || !payload.role.trim()) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const now = new Date();
      profile.workHistory.push({
        role: payload.role.trim(),
        company: payload.company || null,
        employmentType: payload.employmentType || 'contract',
        location: payload.location || null,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        isCurrent: Boolean(payload.isCurrent),
        description: payload.description || null,
        highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
        clientsServed: Array.isArray(payload.clientsServed) ? payload.clientsServed : [],
        technologies: Array.isArray(payload.technologies) ? payload.technologies : [],
        createdAt: now,
        updatedAt: now,
      });

      await profile.save();
      const normalized = normalizeWorkHistoryEntries(profile.workHistory);
      return res.status(201).json({ success: true, data: { workHistory: normalized } });
    } catch (error) {
      logger.error('addWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to add work history entry');
    }
  }

  /**
   * Update an existing work history entry
   */
  static async updateWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const entryId = req.params.entryId;
    if (!workerId || !entryId) {
      return res.status(400).json({ success: false, message: 'workerId and entryId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const entry = profile.workHistory.id(entryId);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      const payload = req.body || {};
      if (payload.role) entry.role = payload.role.trim();
      if (payload.company !== undefined) entry.company = payload.company;
      if (payload.employmentType) entry.employmentType = payload.employmentType;
      if (payload.location !== undefined) entry.location = payload.location;
      if (payload.startDate !== undefined) entry.startDate = payload.startDate;
      if (payload.endDate !== undefined) entry.endDate = payload.endDate;
      if (payload.isCurrent !== undefined) entry.isCurrent = Boolean(payload.isCurrent);
      if (payload.description !== undefined) entry.description = payload.description;
      if (payload.highlights) entry.highlights = Array.isArray(payload.highlights) ? payload.highlights : entry.highlights;
      if (payload.clientsServed) entry.clientsServed = Array.isArray(payload.clientsServed) ? payload.clientsServed : entry.clientsServed;
      if (payload.technologies) entry.technologies = Array.isArray(payload.technologies) ? payload.technologies : entry.technologies;
      entry.updatedAt = new Date();

      await profile.save();
      const normalized = normalizeWorkHistoryEntries([
        entry?.toObject ? entry.toObject() : entry,
      ])[0];

      return res.json({ success: true, data: { workHistory: normalized } });
    } catch (error) {
      logger.error('updateWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to update work history entry');
    }
  }

  /**
   * Delete a work history entry
   */
  static async deleteWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const entryId = req.params.entryId;
    if (!workerId || !entryId) {
      return res.status(400).json({ success: false, message: 'workerId and entryId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const entry = profile.workHistory.id(entryId);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      entry.remove();
      await profile.save();

      return res.status(204).send();
    } catch (error) {
      logger.error('deleteWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to delete work history entry');
    }
  }

  /**
   * Public portfolio feed for worker profiles
   */
  static async getWorkerPortfolio(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!workerProfile) {
        return res.json({ success: true, data: { portfolioItems: [], pagination: generatePagination(1, 1, 0) } });
      }

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
      const offset = (page - 1) * limit;
      const isOwner = canMutateWorkerResource(req.user, userDoc._id);

      const filter = {
        workerProfileId: workerProfile._id,
        isActive: true,
      };

      if (!isOwner) {
        filter.status = 'published';
      } else if (req.query.status) {
        filter.status = req.query.status;
      }

      const [items, total] = await Promise.all([
        PortfolioModel.find(filter)
          .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
          .skip(offset)
          .limit(limit),
        PortfolioModel.countDocuments(filter),
      ]);

      const formatted = items.map((doc) => formatPortfolioDocument(doc));
      return res.json({
        success: true,
        data: {
          portfolioItems: formatted,
          pagination: generatePagination(page, limit, total),
          stats: {
            total,
            published: await PortfolioModel.countDocuments({
              workerProfileId: workerProfile._id,
              isActive: true,
              status: 'published',
            }),
          },
        },
        meta: {
          ownerView: isOwner,
        },
      });
    } catch (error) {
      logger.error('getWorkerPortfolio error:', error);
      return handleServiceError(res, error, 'Failed to load worker portfolio');
    }
  }

  /**
   * Public certificate feed for worker profiles
   */
  static async getWorkerCertificates(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const isOwner = canMutateWorkerResource(req.user, userDoc._id);
      const filter = { workerId: userDoc._id };

      if (!isOwner) {
        filter.status = 'verified';
      } else if (req.query.status) {
        filter.status = req.query.status;
      }

      const certificates = await CertificateModel.find(filter)
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(Math.min(parseInt(req.query.limit || '50', 10), 50));

      const formatted = certificates.map((doc) => formatCertificateDocument(doc));
      return res.json({
        success: true,
        data: {
          certificates: formatted,
          totals: {
            count: formatted.length,
            verified: formatted.filter((cert) => cert.status === 'verified').length,
          },
        },
        meta: { ownerView: isOwner },
      });
    } catch (error) {
      logger.error('getWorkerCertificates error:', error);
      return handleServiceError(res, error, 'Failed to load worker certificates');
    }
  }

  /**
   * Create a portfolio item for a worker (authenticated)
   */
  static async createWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    const validation = validateInput(payload, ['title', 'description']);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to add portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const item = await PortfolioModel.create({
        workerProfileId: profile._id,
        title: payload.title,
        description: payload.description,
        projectType: payload.projectType || 'professional',
        primarySkillId: payload.primarySkillId || null,
        skillsUsed: payload.skillsUsed || [],
        mainImage: payload.mainImage || null,
        images: payload.images || [],
        videos: payload.videos || [],
        documents: payload.documents || [],
        projectValue: payload.projectValue,
        currency: payload.currency || profile.currency || 'GHS',
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        location: payload.location || profile.location || null,
        clientName: payload.clientName || null,
        clientCompany: payload.clientCompany || null,
        clientRating: payload.clientRating || null,
        clientTestimonial: payload.clientTestimonial || null,
        challenges: payload.challenges || null,
        solutions: payload.solutions || null,
        outcomes: payload.outcomes || null,
        lessonsLearned: payload.lessonsLearned || null,
        toolsUsed: payload.toolsUsed || [],
        teamSize: payload.teamSize || null,
        role: payload.role || null,
        responsibilities: payload.responsibilities || [],
        achievements: payload.achievements || [],
        externalLinks: payload.externalLinks || [],
        status: payload.status || 'draft',
        tags: payload.tags || [],
        keywords: payload.keywords || [],
        isFeatured: Boolean(payload.isFeatured),
        isActive: true,
      });

      return res.status(201).json({ success: true, data: { portfolioItem: formatPortfolioDocument(item) } });
    } catch (error) {
      logger.error('createWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to create portfolio item');
    }
  }

  /**
   * Update a worker portfolio item
   */
  static async updateWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const portfolioId = req.params.portfolioId;
    if (!workerId || !portfolioId) {
      return res.status(400).json({ success: false, message: 'workerId and portfolioId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const item = await PortfolioModel.findOne({
        _id: portfolioId,
        workerProfileId: profile._id,
      });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      // SECURITY: Only allow safe portfolio fields (prevent mass assignment)
      const PORTFOLIO_ALLOWED = ['title', 'description', 'images', 'category', 'tags',
        'location', 'clientName', 'projectDate', 'skills', 'isPublic', 'projectUrl'];
      const safeFields = {};
      const rawBody = req.body || {};
      for (const key of PORTFOLIO_ALLOWED) {
        if (key in rawBody) safeFields[key] = rawBody[key];
      }
      Object.assign(item, safeFields, { updatedAt: new Date() });
      await item.save();

      return res.json({ success: true, data: { portfolioItem: formatPortfolioDocument(item) } });
    } catch (error) {
      logger.error('updateWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to update portfolio item');
    }
  }

  /**
   * Delete a worker portfolio item
   */
  static async deleteWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const portfolioId = req.params.portfolioId;
    if (!workerId || !portfolioId) {
      return res.status(400).json({ success: false, message: 'workerId and portfolioId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const deleted = await PortfolioModel.findOneAndDelete({
        _id: portfolioId,
        workerProfileId: profile._id,
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      return res.status(204).send();
    } catch (error) {
      logger.error('deleteWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to delete portfolio item');
    }
  }

  /**
   * Create a worker certificate (authenticated)
   */
  static async addWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    const validation = validateInput(payload, ['name', 'issuer', 'issuedAt']);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to add certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const certificate = await CertificateModel.create({
        workerId: userDoc._id,
        name: payload.name,
        issuer: payload.issuer,
        credentialId: payload.credentialId || null,
        url: payload.url || null,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt || null,
        status: payload.status || 'draft',
        verification: payload.verification || { result: 'pending' },
        metadata: payload.metadata || {},
      });

      return res.status(201).json({ success: true, data: { certificate: formatCertificateDocument(certificate) } });
    } catch (error) {
      logger.error('addWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to add certificate');
    }
  }

  /**
   * Update a worker certificate
   */
  static async updateWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const certificateId = req.params.certificateId;
    if (!workerId || !certificateId) {
      return res.status(400).json({ success: false, message: 'workerId and certificateId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      // SECURITY: Only allow safe certificate fields (prevent mass assignment)
      const CERT_SAFE = ['name', 'issuer', 'credentialId', 'url', 'issuedAt', 'expiresAt', 'description', 'category'];
      const safeUpdate = {};
      for (const k of CERT_SAFE) { if (k in req.body) safeUpdate[k] = req.body[k]; }
      safeUpdate.updatedAt = new Date();

      const updated = await CertificateModel.findOneAndUpdate(
        { _id: certificateId, workerId: userDoc._id },
        { $set: safeUpdate },
        { new: true, runValidators: true },
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      return res.json({ success: true, data: { certificate: formatCertificateDocument(updated) } });
    } catch (error) {
      logger.error('updateWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to update certificate');
    }
  }

  /**
   * Delete a worker certificate
   */
  static async deleteWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const certificateId = req.params.certificateId;
    if (!workerId || !certificateId) {
      return res.status(400).json({ success: false, message: 'workerId and certificateId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const deleted = await CertificateModel.findOneAndDelete({
        _id: certificateId,
        workerId: userDoc._id,
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      return res.status(204).send();
    } catch (error) {
      logger.error('deleteWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to delete certificate');
    }
  }

  /**
   * Get worker availability by worker ID
   */
  static async getWorkerAvailability(req, res) {
    const workerId = req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker ID required' });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildAvailabilityFallbackPayload(workerId, reason),
      });

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      logger.warn('Invalid worker ID supplied for availability; returning fallback', { workerId });
      return sendFallback('INVALID_WORKER_ID');
    }

    if (mongoose.connection.readyState !== 1) {
      logger.warn('⚠️ MongoDB not ready for availability request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoAvailability = modelsModule.Availability;

      if (!MongoUser || !MongoAvailability) {
        logger.warn('Availability request missing initialized models, returning fallback');
        return sendFallback('MODELS_NOT_INITIALIZED');
      }

      // Get worker user info
      const worker = await MongoUser.findById(workerId).lean();
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const availability = await MongoAvailability.findOne({ user: workerId }).lean();

      if (!availability) {
        return res.json({
          success: true,
          data: {
            status: 'not_set',
            isAvailable: true,
            timezone: 'Africa/Accra',
            daySlots: [],
            schedule: [],
            nextAvailable: null,
            message: 'Availability not configured'
          }
        });
      }

      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const normalizedSchedule = Array.isArray(availability.daySlots)
        ? availability.daySlots.map((daySlot) => ({
          day: dayMap[daySlot.dayOfWeek] ?? 'unknown',
          available: Array.isArray(daySlot.slots) && daySlot.slots.length > 0,
          slots: Array.isArray(daySlot.slots)
            ? daySlot.slots.map((slot) => ({
              start: slot.start,
              end: slot.end,
            }))
            : [],
        }))
        : [];

      const computeNextAvailable = () => {
        if (!normalizedSchedule.length) {
          return null;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let offset = 0; offset < 7; offset += 1) {
          const dayIndex = (now.getDay() + offset) % 7;
          const dayName = dayMap[dayIndex];
          const dayEntry = normalizedSchedule.find((entry) => entry.day === dayName && entry.slots.length > 0);
          if (!dayEntry) {
            continue;
          }

          for (const slot of dayEntry.slots) {
            const [startHour = '0', startMinute = '0'] = slot.start.split(':');
            const slotMinutes = Number(startHour) * 60 + Number(startMinute);
            if (offset > 0 || slotMinutes >= currentMinutes) {
              return `${dayName} ${slot.start}`;
            }
          }
        }

        return null;
      };

      const responseAvailability = {
        status: availability.isAvailable ? 'available' : 'unavailable',
        isAvailable: Boolean(availability.isAvailable),
        timezone: availability.timezone,
        daySlots: availability.daySlots || [],
        schedule: normalizedSchedule,
        nextAvailable: computeNextAvailable(),
        lastUpdated: availability.updatedAt,
        pausedUntil: availability.pausedUntil || null,
      };

      const includePrivateFields = canViewWorkerPrivateFields(req.user, workerId);
      const publicAvailability = buildPublicAvailabilityView(responseAvailability);

      return res.json({
        success: true,
        data: includePrivateFields
          ? responseAvailability
          : publicAvailability
      });
    } catch (error) {
      logger.error('❌ ERROR in getWorkerAvailability - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        availabilityModelLoaded: !!modelsModule?.Availability,
        userModelLoaded: !!modelsModule?.User,
        connectionState: mongoose.connection.readyState
      });
      if (error?.name === 'BSONVersionError') {
        logger.warn('⚠️ BSON version mismatch detected in getWorkerAvailability, serving fallback payload');
        return sendFallback('BSON_VERSION_MISMATCH');
      }
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      if (error?.name === 'CastError') {
        return sendFallback('INVALID_WORKER_ID');
      }
      return handleServiceError(res, error, 'Failed to get worker availability');
    }
  }

  /**
   * Update worker profile
   * PUT /workers/:id
   */
  static async updateWorkerProfile(req, res) {
    const workerId = req.params.id || req.params.workerId;
    
    if (!workerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Worker ID is required' 
      });
    }

    try {
      await ensureConnection({ timeoutMs: 30000 });

      const { User } = require('../models');

      // Find the worker user
      const user = await User.findById(workerId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Worker not found' 
        });
      }

      if (user.role !== 'worker') {
        return res.status(400).json({ 
          success: false, 
          message: 'User is not a worker' 
        });
      }

      if (!canMutateWorkerResource(req.user, user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this worker profile'
        });
      }

      const profile = await getMutableWorkerProfile(user);

      // Extract profile data from request body
      const {
        firstName,
        lastName,
        title,
        bio,
        hourlyRate,
        experience,
        skills,
        education,
        languages,
        location,
        phone,
        portfolio,
        profilePicture,
        profilePictureMetadata,
        latitude,
        longitude,
        serviceRadius,
      } = req.body;

      const hasLatitude = latitude !== undefined && latitude !== null && latitude !== '';
      const hasLongitude = longitude !== undefined && longitude !== null && longitude !== '';

      if (hasLatitude !== hasLongitude) {
        return res.status(400).json({
          success: false,
          message: 'Both latitude and longitude are required to update worker coordinates',
        });
      }

      let parsedLatitude;
      let parsedLongitude;
      if (hasLatitude && hasLongitude) {
        parsedLatitude = Number(latitude);
        parsedLongitude = Number(longitude);

        if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitude must be between -90 and 90',
          });
        }

        if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitude must be between -180 and 180',
          });
        }
      }

      if (serviceRadius !== undefined && serviceRadius !== null && serviceRadius !== '') {
        const parsedServiceRadius = Number(serviceRadius);
        if (!Number.isFinite(parsedServiceRadius) || parsedServiceRadius < 1 || parsedServiceRadius > 500) {
          return res.status(400).json({
            success: false,
            message: 'Service radius must be between 1 and 500 kilometers',
          });
        }
        profile.serviceRadius = parsedServiceRadius;
      }

      // Update basic user fields
      if (firstName) user.firstName = sanitizeText(firstName);
      if (lastName) user.lastName = sanitizeText(lastName);
      if (phone) user.phone = phone;

      const sanitizedTitle = title ? sanitizeText(title) : null;
      const sanitizedBio = bio ? sanitizeText(bio) : null;
      const sanitizedLocation = location ? sanitizeText(location) : null;
      const normalizedSkills = Array.isArray(skills)
        ? skills.map((skill) => sanitizeText(skill)).filter(Boolean)
        : null;

      if (typeof profilePicture === 'string' && profilePicture.trim()) {
        user.profilePicture = profilePicture.trim();
      }

      if (profilePictureMetadata && typeof profilePictureMetadata === 'object') {
        user.profilePictureMetadata = profilePictureMetadata;
      }

      if (sanitizedTitle) {
        profile.title = sanitizedTitle;
        profile.headline = sanitizedTitle;
        profile.profession = sanitizedTitle;
      }
      if (sanitizedBio) profile.bio = sanitizedBio;
      if (hourlyRate !== undefined) profile.hourlyRate = Number(hourlyRate);
      if (experience !== undefined) profile.yearsOfExperience = Number(experience);
      if (sanitizedLocation) profile.location = sanitizedLocation;
      if (normalizedSkills) profile.skills = normalizedSkills;
      if (Array.isArray(education)) profile.education = education;
      if (Array.isArray(languages)) profile.languages = languages;
      if (Array.isArray(portfolio)) profile.portfolioItems = portfolio;
      if (typeof profilePicture === 'string' && profilePicture.trim()) {
        profile.profilePicture = profilePicture.trim();
      }
      if (hasLatitude && hasLongitude) {
        profile.latitude = parsedLatitude;
        profile.longitude = parsedLongitude;
        user.locationCoordinates = {
          type: 'Point',
          coordinates: [parsedLongitude, parsedLatitude],
        };
      }

      // Save the updated user and worker profile
      await Promise.all([user.save(), profile.save()]);

      const canonicalWorker = buildCanonicalWorkerSnapshot(
        typeof user.toObject === 'function' ? user.toObject() : user,
        typeof profile.toObject === 'function' ? profile.toObject() : profile,
      );

      // Return the updated profile
      const updatedProfile = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImageUrl: canonicalWorker.profilePicture || null,
        profilePicture: canonicalWorker.profilePicture || null,
        workerProfileId: profile._id,
        profession: canonicalWorker.profession || null,
        title: profile.title || profile.headline || canonicalWorker.profession || null,
        bio: canonicalWorker.bio || null,
        location: canonicalWorker.location || null,
        hourlyRate: canonicalWorker.hourlyRate ?? null,
        currency: canonicalWorker.currency || 'GHS',
        experience: canonicalWorker.yearsOfExperience ?? null,
        skills: canonicalWorker.skills,
        latitude: Number.isFinite(Number(profile.latitude)) ? Number(profile.latitude) : null,
        longitude: Number.isFinite(Number(profile.longitude)) ? Number(profile.longitude) : null,
        serviceRadius: Number.isFinite(Number(profile.serviceRadius)) ? Number(profile.serviceRadius) : null,
        languages: profile.languages || [],
        education: profile.education || [],
      };

      return res.json({ 
        success: true, 
        data: updatedProfile,
        message: 'Worker profile updated successfully'
      });

    } catch (error) {
      logger.error('updateWorkerProfile error:', error);
      return handleServiceError(res, error, 'Failed to update worker profile');
    }
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

module.exports = WorkerController;
