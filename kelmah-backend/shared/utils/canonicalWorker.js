const isNil = (value) => value === null || value === undefined;

const toSafeString = (value, fallback = '') => {
  if (isNil(value)) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value?.toString === 'function') {
    try {
      return value.toString();
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : fallback;
};

const uniqStrings = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = toSafeString(value, '').trim();
    if (!normalized) return false;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeSkillNames = (skills = []) => uniqStrings(
  (Array.isArray(skills) ? skills : []).map((skill) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') {
      return skill.name || skill.skillName || skill.title || '';
    }
    return '';
  }),
);

const buildCanonicalWorkerSnapshot = (userDoc = {}, workerProfileDoc = {}) => {
  const firstName = toSafeString(userDoc.firstName, '').trim();
  const lastName = toSafeString(userDoc.lastName, '').trim();
  const mergedSkills = uniqStrings([
    ...normalizeSkillNames(userDoc.skills || []),
    ...normalizeSkillNames(workerProfileDoc.skills || []),
    ...normalizeSkillNames((workerProfileDoc.skillEntries || []).map((entry) => entry?.name || entry)),
  ]);

  const mergedSpecializations = uniqStrings([
    ...(Array.isArray(userDoc.specializations) ? userDoc.specializations : []),
    ...(Array.isArray(workerProfileDoc.specializations) ? workerProfileDoc.specializations : []),
  ]);

  const canonical = {
    id: userDoc._id?.toString?.() || userDoc.id || workerProfileDoc.userId?.toString?.() || null,
    userId: userDoc._id?.toString?.() || userDoc.id || workerProfileDoc.userId?.toString?.() || null,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || 'Skilled Worker',
    role: userDoc.role || 'worker',
    isActive: userDoc.isActive !== false,
    profession:
      toSafeString(userDoc.profession, '').trim() ||
      toSafeString(workerProfileDoc.profession, '').trim() ||
      mergedSpecializations[0] ||
      mergedSkills[0] ||
      'General Worker',
    bio:
      toSafeString(workerProfileDoc.bio, '').trim() ||
      toSafeString(userDoc.bio, '').trim() ||
      '',
    location:
      toSafeString(workerProfileDoc.location, '').trim() ||
      toSafeString(userDoc.location, '').trim() ||
      'Ghana',
    hourlyRate: toSafeNumber(workerProfileDoc.hourlyRate, toSafeNumber(userDoc.hourlyRate, 0)),
    currency: workerProfileDoc.currency || userDoc.currency || 'GHS',
    rating: toSafeNumber(workerProfileDoc.rating, toSafeNumber(userDoc.rating, 0)),
    totalReviews: toSafeNumber(workerProfileDoc.totalReviews, toSafeNumber(userDoc.totalReviews, 0)),
    totalJobsCompleted: toSafeNumber(
      workerProfileDoc.totalJobsCompleted,
      toSafeNumber(userDoc.totalJobsCompleted, toSafeNumber(workerProfileDoc.completedJobs, 0)),
    ),
    availabilityStatus:
      workerProfileDoc.availabilityStatus || userDoc.availabilityStatus || 'available',
    isVerified:
      typeof workerProfileDoc.isVerified === 'boolean'
        ? workerProfileDoc.isVerified
        : Boolean(userDoc.isVerified),
    profilePicture:
      workerProfileDoc.profilePicture || userDoc.profilePicture || userDoc.profileImage || null,
    yearsOfExperience: toSafeNumber(
      workerProfileDoc.yearsOfExperience,
      toSafeNumber(userDoc.yearsOfExperience, 0),
    ),
    experienceLevel: workerProfileDoc.experienceLevel || userDoc.experienceLevel || null,
    workType:
      (Array.isArray(workerProfileDoc.preferredJobTypes) && workerProfileDoc.preferredJobTypes[0]) ||
      workerProfileDoc.workingHoursPreference ||
      userDoc.workerProfile?.workType ||
      null,
    specializations: mergedSpecializations,
    skills: mergedSkills,
    locationCoordinates: userDoc.locationCoordinates || null,
    workerProfile: workerProfileDoc || null,
    updatedAt: workerProfileDoc.updatedAt || userDoc.updatedAt || null,
    createdAt: workerProfileDoc.createdAt || userDoc.createdAt || null,
  };

  return canonical;
};

module.exports = {
  buildCanonicalWorkerSnapshot,
  normalizeSkillNames,
};
