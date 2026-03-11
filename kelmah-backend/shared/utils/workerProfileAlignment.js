const { buildCanonicalProfession, normalizeSkillNames } = require('./canonicalWorker');

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const uniqStrings = (values = []) => {
  const seen = new Set();

  return values.filter((value) => {
    const normalized = normalizeText(value);
    if (!normalized) {
      return false;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizeStringArray = (values = []) =>
  uniqStrings(Array.isArray(values) ? values : []);

const getProfileOwnedSkills = (workerProfileDoc = {}) =>
  uniqStrings([
    ...normalizeSkillNames(workerProfileDoc.skills || []),
    ...normalizeSkillNames((workerProfileDoc.skillEntries || []).map((entry) => entry?.name || entry)),
  ]);

const getUserOwnedSkills = (userDoc = {}) =>
  uniqStrings(normalizeSkillNames(userDoc.skills || []));

const getProfileOwnedSpecializations = (workerProfileDoc = {}) =>
  normalizeStringArray(workerProfileDoc.specializations || []);

const getUserOwnedSpecializations = (userDoc = {}) =>
  normalizeStringArray(userDoc.specializations || []);

const normalizeForCompare = (value) => normalizeText(value).toLowerCase();

const arraysEqual = (left = [], right = []) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => normalizeForCompare(value) === normalizeForCompare(right[index]));
};

const buildAuthoritativeWorkerSummary = (userDoc = {}, workerProfileDoc = {}) => {
  const profession = normalizeText(buildCanonicalProfession(userDoc, workerProfileDoc));
  const bio = normalizeText(workerProfileDoc.bio) || normalizeText(userDoc.bio);

  const profileSkills = getProfileOwnedSkills(workerProfileDoc);
  const userSkills = getUserOwnedSkills(userDoc);
  const profileSpecializations = getProfileOwnedSpecializations(workerProfileDoc);
  const userSpecializations = getUserOwnedSpecializations(userDoc);

  return {
    profession,
    bio,
    skills: profileSkills.length > 0 ? profileSkills : userSkills,
    specializations:
      profileSpecializations.length > 0 ? profileSpecializations : userSpecializations,
    sources: {
      profession: profileSkills.length > 0 || profileSpecializations.length > 0 || normalizeText(workerProfileDoc.profession) || normalizeText(workerProfileDoc.title) || normalizeText(workerProfileDoc.headline)
        ? 'workerProfile'
        : profession
          ? 'user'
          : 'none',
      bio: normalizeText(workerProfileDoc.bio) ? 'workerProfile' : normalizeText(userDoc.bio) ? 'user' : 'none',
      skills: profileSkills.length > 0 ? 'workerProfile' : userSkills.length > 0 ? 'user' : 'none',
      specializations: profileSpecializations.length > 0 ? 'workerProfile' : userSpecializations.length > 0 ? 'user' : 'none',
    },
  };
};

const buildProfileSeed = (userDoc = {}, authoritative = {}) => {
  const seed = {
    userId: userDoc._id || userDoc.id,
  };

  if (authoritative.profession) {
    seed.profession = authoritative.profession;
  }

  if (authoritative.bio) {
    seed.bio = authoritative.bio;
  }

  if (authoritative.skills.length > 0) {
    seed.skills = authoritative.skills;
  }

  if (authoritative.specializations.length > 0) {
    seed.specializations = authoritative.specializations;
  }

  return seed;
};

const calculateWorkerProfileAlignment = (userDoc = {}, workerProfileDoc = null) => {
  const authoritative = buildAuthoritativeWorkerSummary(userDoc, workerProfileDoc || {});
  const userUpdates = {};
  const profileUpdates = {};
  const mismatches = {};

  const currentUserProfession = normalizeText(userDoc.profession);
  const currentProfileProfession = normalizeText(workerProfileDoc?.profession);
  const currentUserBio = normalizeText(userDoc.bio);
  const currentProfileBio = normalizeText(workerProfileDoc?.bio);
  const currentUserSkills = getUserOwnedSkills(userDoc);
  const currentProfileSkills = getProfileOwnedSkills(workerProfileDoc || {});
  const currentUserSpecializations = getUserOwnedSpecializations(userDoc);
  const currentProfileSpecializations = getProfileOwnedSpecializations(workerProfileDoc || {});

  if (authoritative.profession) {
    mismatches.profession =
      normalizeForCompare(currentUserProfession) !== normalizeForCompare(authoritative.profession) ||
      normalizeForCompare(currentProfileProfession) !== normalizeForCompare(authoritative.profession);

    if (normalizeForCompare(currentUserProfession) !== normalizeForCompare(authoritative.profession)) {
      userUpdates.profession = authoritative.profession;
    }

    if (normalizeForCompare(currentProfileProfession) !== normalizeForCompare(authoritative.profession)) {
      profileUpdates.profession = authoritative.profession;
    }
  } else {
    mismatches.profession = false;
  }

  if (authoritative.bio) {
    mismatches.bio =
      normalizeForCompare(currentUserBio) !== normalizeForCompare(authoritative.bio) ||
      normalizeForCompare(currentProfileBio) !== normalizeForCompare(authoritative.bio);

    if (normalizeForCompare(currentUserBio) !== normalizeForCompare(authoritative.bio)) {
      userUpdates.bio = authoritative.bio;
    }

    if (normalizeForCompare(currentProfileBio) !== normalizeForCompare(authoritative.bio)) {
      profileUpdates.bio = authoritative.bio;
    }
  } else {
    mismatches.bio = false;
  }

  mismatches.skills =
    authoritative.skills.length > 0 &&
    (!arraysEqual(currentUserSkills, authoritative.skills) || !arraysEqual(currentProfileSkills, authoritative.skills));
  if (authoritative.skills.length > 0) {
    if (!arraysEqual(currentUserSkills, authoritative.skills)) {
      userUpdates.skills = authoritative.skills;
    }

    if (!arraysEqual(currentProfileSkills, authoritative.skills)) {
      profileUpdates.skills = authoritative.skills;
    }
  }

  mismatches.specializations =
    authoritative.specializations.length > 0 &&
    (!arraysEqual(currentUserSpecializations, authoritative.specializations) ||
      !arraysEqual(currentProfileSpecializations, authoritative.specializations));
  if (authoritative.specializations.length > 0) {
    if (!arraysEqual(currentUserSpecializations, authoritative.specializations)) {
      userUpdates.specializations = authoritative.specializations;
    }

    if (!arraysEqual(currentProfileSpecializations, authoritative.specializations)) {
      profileUpdates.specializations = authoritative.specializations;
    }
  }

  const missingProfile = !workerProfileDoc;

  return {
    authoritative,
    mismatches,
    missingProfile,
    userUpdates,
    profileUpdates,
    profileCreate: missingProfile ? buildProfileSeed(userDoc, authoritative) : null,
    hasChanges:
      missingProfile || Object.keys(userUpdates).length > 0 || Object.keys(profileUpdates).length > 0,
  };
};

module.exports = {
  buildAuthoritativeWorkerSummary,
  calculateWorkerProfileAlignment,
  getProfileOwnedSkills,
  getProfileOwnedSpecializations,
  getUserOwnedSkills,
  getUserOwnedSpecializations,
};