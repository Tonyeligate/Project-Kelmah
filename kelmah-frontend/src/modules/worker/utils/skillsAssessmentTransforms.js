const PROFICIENCY_LEVELS = {
  beginner: 1,
  basic: 2,
  intermediate: 3,
  advanced: 4,
  expert: 5,
};

export const normalizeProficiencyLevel = (value) => {
  if (typeof value === 'number') {
    const numeric = Number.isFinite(value) ? value : 3;

    if (numeric > 5) {
      if (numeric <= 100) {
        return Math.max(1, Math.min(5, Math.round(numeric / 20)));
      }
      return 5;
    }

    if (numeric <= 0) {
      return 1;
    }

    return Math.max(1, Math.min(5, numeric));
  }

  if (typeof value === 'string') {
    const key = value.toLowerCase();
    return PROFICIENCY_LEVELS[key] || 3;
  }

  return 3;
};

export const mapLevelToPercentage = (level) => {
  const normalized = normalizeProficiencyLevel(level);
  return Math.min(100, Math.max(20, Math.round((normalized / 5) * 100)));
};

export const difficultyFromProficiency = (level) => {
  const normalized = normalizeProficiencyLevel(level);
  if (normalized <= 1) return 'beginner';
  if (normalized <= 2) return 'basic';
  if (normalized <= 3) return 'intermediate';
  if (normalized <= 4) return 'advanced';
  return 'expert';
};

export const normalizeSkillForDisplay = (skill, index = 0) => {
  const proficiency = normalizeProficiencyLevel(
    skill?.proficiencyLevel ?? skill?.level ?? skill?.proficiency ?? 3,
  );

  return {
    id: skill?.id || skill?._id || `skill-${index}`,
    name: skill?.name || skill?.skillName || `Skill ${index + 1}`,
    category: skill?.category || skill?.skillCategory || 'General',
    verified: Boolean(
      skill?.isVerified ?? skill?.verified ?? skill?.status === 'verified',
    ),
    level: mapLevelToPercentage(proficiency),
    proficiencyLevel: proficiency,
    yearsOfExperience: Number(
      skill?.yearsOfExperience ?? skill?.experience ?? skill?.years ?? 0,
    ),
  };
};

export const createAssessmentFromSkill = (skill, index) => {
  const proficiency = normalizeProficiencyLevel(
    skill?.proficiencyLevel ?? skill?.level ?? skill?.proficiency ?? 3,
  );
  const baseDuration = 25 + proficiency * 5;
  const baseQuestions = 10 + proficiency * 4;
  const passingScore = Math.min(90, 65 + proficiency * 5);
  const rating = Math.min(4.9, 4.2 + proficiency * 0.12);

  return {
    id: skill?.id || `assessment-${index}`,
    title: `${skill?.name || 'Skill'} Proficiency Assessment`,
    category: skill?.category || 'General',
    difficulty: difficultyFromProficiency(proficiency),
    duration: baseDuration,
    questions: baseQuestions,
    description: `Validate your ${skill?.name || 'skill'} expertise to unlock verified badges and greater visibility to hirers.`,
    skills: [skill?.name || 'General Skill'],
    certification: true,
    premium: proficiency >= 4,
    rating: Number(rating.toFixed(1)),
    completions: 180 + index * 35,
    passingScore,
  };
};

export const buildAssessmentsFromSkills = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  return skills.map((skill, index) => createAssessmentFromSkill(skill, index));
};

export const buildCompletedAssessments = (certifications = []) => {
  if (!Array.isArray(certifications) || certifications.length === 0) {
    return [];
  }

  return certifications.map((cert, index) => {
    const verified = Boolean(cert?.isVerified);
    const score = Math.min(100, Math.max(70, verified ? 92 : 85));
    const totalQuestions = 20;
    const correctAnswers = Math.round((score / 100) * totalQuestions);

    return {
      id: cert?.id || cert?._id || `cert-${index}`,
      title: cert?.name || 'Certification Assessment',
      score,
      maxScore: 100,
      correctAnswers,
      totalQuestions,
      timeSpent: cert?.timeSpent ?? 45,
      certificate: true,
      completedAt:
        cert?.issueDate || cert?.completedAt || new Date().toISOString(),
      passingScore: cert?.passingScore ?? 70,
    };
  });
};

export const buildAnalyticsSummary = ({
  skills = [],
  completedTests = [],
  workerAnalytics,
}) => {
  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeCompleted = Array.isArray(completedTests) ? completedTests : [];

  const jobsCompleted = Number(
    workerAnalytics?.jobs?.totalCompleted ??
      workerAnalytics?.jobs?.completed ??
      workerAnalytics?.jobs?.completedJobs ??
      0,
  );

  const totalTests = safeCompleted.length || jobsCompleted;
  const avgScore = safeCompleted.length
    ? Math.round(
        safeCompleted.reduce((sum, test) => sum + (test.score || 0), 0) /
          safeCompleted.length,
      )
    : workerAnalytics?.reviews?.averageRating
      ? Math.round(workerAnalytics.reviews.averageRating * 20)
      : 0;

  const totalTimeSpent = safeCompleted.reduce(
    (sum, test) => sum + (test.timeSpent || 0),
    0,
  );
  const certifications = safeCompleted.filter(
    (test) => test.certificate,
  ).length;
  const skillsVerified = safeSkills.filter((skill) => skill.verified).length;

  const rawRank = workerAnalytics?.reviews?.averageRating
    ? workerAnalytics.reviews.averageRating * 20
    : 60 + safeSkills.length * 3 + skillsVerified * 2;
  const rankPercentile = Math.min(99, Math.max(45, Math.round(rawRank)));

  const strengths = safeSkills
    .filter((skill) => skill.level >= 75)
    .map((skill) => skill.name);
  const improvementAreas = safeSkills
    .filter((skill) => skill.level < 60)
    .map((skill) => skill.name);

  if (!strengths.length && safeSkills.length) {
    strengths.push(safeSkills[0].name);
  }

  if (!improvementAreas.length && safeSkills.length > 1) {
    improvementAreas.push(safeSkills[safeSkills.length - 1].name);
  }

  return {
    totalTests: totalTests || safeCompleted.length,
    avgScore: avgScore || 0,
    totalTimeSpent,
    certifications,
    skillsVerified,
    rankPercentile,
    strengths: strengths.length ? strengths : ['Communication'],
    improvementAreas: improvementAreas.length
      ? improvementAreas
      : ['Advanced training recommended'],
  };
};
