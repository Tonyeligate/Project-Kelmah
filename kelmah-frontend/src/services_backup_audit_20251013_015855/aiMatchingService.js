/**
 * Enhanced AI-Powered Job Matching Service for Ghana
 * Sophisticated matching algorithm considering Ghana-specific criteria
 */

class AIMatchingService {
  constructor() {
    this.matchingCriteria = {
      // Location factors (very important in Ghana due to transportation)
      location: {
        weight: 0.25,
        factors: {
          distance: 0.4, // Physical distance
          transportAccess: 0.3, // Public transport availability
          regionalPreference: 0.3, // Same region preference
        },
      },

      // Skills and expertise matching
      skills: {
        weight: 0.3,
        factors: {
          primarySkills: 0.4, // Core job requirements
          certifications: 0.3, // Ghana trade certifications
          experience: 0.2, // Years of experience
          specializations: 0.1, // Niche specializations
        },
      },

      // Price and budget compatibility
      pricing: {
        weight: 0.2,
        factors: {
          budgetMatch: 0.5, // Price within budget
          valueForMoney: 0.3, // Quality vs price ratio
          paymentTerms: 0.2, // Payment method compatibility
        },
      },

      // Reliability and quality factors
      reliability: {
        weight: 0.15,
        factors: {
          rating: 0.4, // Overall rating
          completionRate: 0.3, // Job completion rate
          responseTime: 0.2, // How quickly they respond
          punctuality: 0.1, // On-time performance
        },
      },

      // Ghana-specific cultural factors
      cultural: {
        weight: 0.1,
        factors: {
          languageMatch: 0.4, // Local language compatibility
          culturalFit: 0.3, // Understanding of local customs
          communityRep: 0.3, // Community reputation
        },
      },
    };

    // Ghana regions and major cities
    this.ghanaRegions = {
      'Greater Accra': {
        major_cities: ['Accra', 'Tema', 'Kasoa', 'Madina', 'Ashaiman'],
        transport_hubs: ['Kaneshie', 'Circle', 'Lapaz', 'Achimota'],
        coordinates: { lat: 5.6037, lng: -0.187 },
      },
      Ashanti: {
        major_cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Bekwai'],
        transport_hubs: ['Kejetia', 'Adum', 'Bantama'],
        coordinates: { lat: 6.7167, lng: -1.6833 },
      },
      Western: {
        major_cities: ['Takoradi', 'Sekondi', 'Tarkwa', 'Axim'],
        transport_hubs: ['Market Circle', 'Paa Grant'],
        coordinates: { lat: 4.8967, lng: -1.7581 },
      },
      Eastern: {
        major_cities: ['Koforidua', 'Akosombo', 'Nkawkaw', 'Akim Oda'],
        transport_hubs: ['Koforidua Station', 'Galloway'],
        coordinates: { lat: 6.0891, lng: -0.2594 },
      },
    };

    // Ghana trade certifications and their weights
    this.ghanaCertifications = {
      'Ghana Institute of Plumbers': { weight: 0.9, trades: ['plumbing'] },
      'Institute of Electrical Engineers': {
        weight: 0.9,
        trades: ['electrical'],
      },
      'Ghana Standards Authority': { weight: 0.8, trades: ['all'] },
      'National Vocational Training Institute': {
        weight: 0.7,
        trades: ['all'],
      },
      'Council for Technical and Vocational Education': {
        weight: 0.7,
        trades: ['all'],
      },
      'Traditional Apprenticeship': { weight: 0.6, trades: ['all'] },
    };

    // Common Ghana local languages and their regional prevalence
    this.ghanaLanguages = {
      Twi: { regions: ['Ashanti', 'Eastern', 'Brong Ahafo'], speakers: 0.58 },
      Ga: { regions: ['Greater Accra'], speakers: 0.16 },
      Ewe: { regions: ['Volta', 'Greater Accra'], speakers: 0.14 },
      Dagbani: { regions: ['Northern'], speakers: 0.07 },
      English: { regions: ['all'], speakers: 0.67 }, // Official language
      Hausa: {
        regions: ['Northern', 'Upper East', 'Upper West'],
        speakers: 0.04,
      },
    };
  }

  /**
   * Enhanced job matching with Ghana-specific criteria
   * @param {Object} jobRequest - Job posting details
   * @param {Array} availableWorkers - Pool of available workers
   * @param {Object} options - Matching options and preferences
   * @returns {Array} - Ranked list of worker matches
   */
  async findBestMatches(jobRequest, availableWorkers, options = {}) {
    try {
      console.log(
        `🧠 AI Matching: Finding matches for ${jobRequest.title} in ${jobRequest.location}`,
      );

      const matches = [];

      for (const worker of availableWorkers) {
        const matchScore = await this.calculateMatchScore(
          jobRequest,
          worker,
          options,
        );

        if (matchScore.totalScore >= (options.minimumScore || 0.4)) {
          matches.push({
            worker,
            matchScore,
            reasoning: this.generateMatchReasoning(matchScore),
            recommendations: this.generateRecommendations(
              jobRequest,
              worker,
              matchScore,
            ),
          });
        }
      }

      // Sort by total score (descending)
      matches.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);

      // Apply Ghana-specific boosting
      const boostedMatches = this.applyGhanaBoosting(matches, jobRequest);

      // Add diversity scoring to prevent clustering
      const diverseMatches = this.addDiversityScoring(boostedMatches);

      console.log(`✨ AI Matching: Found ${matches.length} qualified matches`);

      return diverseMatches.slice(0, options.maxResults || 20);
    } catch (error) {
      console.error('AI Matching Error:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive match score
   * @param {Object} job - Job details
   * @param {Object} worker - Worker profile
   * @param {Object} options - Matching options
   * @returns {Object} - Detailed match scores
   */
  async calculateMatchScore(job, worker, options = {}) {
    const scores = {
      location: this.calculateLocationScore(job, worker),
      skills: this.calculateSkillsScore(job, worker),
      pricing: this.calculatePricingScore(job, worker),
      reliability: this.calculateReliabilityScore(worker),
      cultural: this.calculateCulturalScore(job, worker),
    };

    // Calculate weighted total score
    let totalScore = 0;
    const breakdown = {};

    for (const [category, score] of Object.entries(scores)) {
      const weight = this.matchingCriteria[category].weight;
      const weightedScore = score * weight;
      totalScore += weightedScore;

      breakdown[category] = {
        rawScore: score,
        weight: weight,
        weightedScore: weightedScore,
      };
    }

    return {
      totalScore: Math.min(totalScore, 1.0), // Cap at 1.0
      breakdown,
      rawScores: scores,
      confidence: this.calculateConfidence(scores),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate location-based matching score
   */
  calculateLocationScore(job, worker) {
    const jobLocation = this.parseLocation(job.location);
    const workerLocation = this.parseLocation(worker.location);

    // Calculate distance score
    const distance = this.calculateDistance(jobLocation, workerLocation);
    let distanceScore = 1.0;

    if (distance <= 5)
      distanceScore = 1.0; // Within 5km
    else if (distance <= 15)
      distanceScore = 0.8; // Within 15km
    else if (distance <= 30)
      distanceScore = 0.6; // Within 30km
    else if (distance <= 50)
      distanceScore = 0.4; // Within 50km
    else distanceScore = 0.2; // Beyond 50km

    // Transport accessibility bonus
    const transportScore = this.calculateTransportScore(
      jobLocation,
      workerLocation,
    );

    // Regional preference (same region bonus)
    const regionalScore =
      jobLocation.region === workerLocation.region ? 1.0 : 0.7;

    // Combine scores based on factors
    const factors = this.matchingCriteria.location.factors;
    return (
      distanceScore * factors.distance +
      transportScore * factors.transportAccess +
      regionalScore * factors.regionalPreference
    );
  }

  /**
   * Calculate skills-based matching score
   */
  calculateSkillsScore(job, worker) {
    const jobSkills = job.skillsRequired || [];
    const workerSkills = worker.skills || [];

    // Primary skills matching
    const primaryMatch = this.calculateSkillOverlap(jobSkills, workerSkills);

    // Ghana certifications bonus
    const certificationScore = this.calculateCertificationScore(
      job.category,
      worker.certifications || [],
    );

    // Experience level matching
    const experienceScore = this.calculateExperienceScore(
      job.experienceLevel,
      worker.experience,
    );

    // Specialization bonus
    const specializationScore = this.calculateSpecializationScore(
      job.category,
      worker.specializations || [],
    );

    const factors = this.matchingCriteria.skills.factors;
    return (
      primaryMatch * factors.primarySkills +
      certificationScore * factors.certifications +
      experienceScore * factors.experience +
      specializationScore * factors.specializations
    );
  }

  /**
   * Calculate pricing compatibility score
   */
  calculatePricingScore(job, worker) {
    const jobBudget = job.budget || job.maxBudget || 0;
    const workerRate = worker.hourlyRate || worker.averageRate || 0;

    if (!jobBudget || !workerRate) return 0.5; // Neutral if no pricing info

    // Budget compatibility
    let budgetScore = 1.0;
    const estimatedCost = workerRate * (job.estimatedHours || 8);

    if (estimatedCost <= jobBudget) {
      budgetScore = 1.0;
    } else if (estimatedCost <= jobBudget * 1.2) {
      budgetScore = 0.8; // 20% over budget
    } else if (estimatedCost <= jobBudget * 1.5) {
      budgetScore = 0.5; // 50% over budget
    } else {
      budgetScore = 0.2; // Significantly over budget
    }

    // Value for money (quality vs price)
    const valueScore = this.calculateValueScore(worker);

    // Payment terms compatibility
    const paymentScore = this.calculatePaymentCompatibility(
      job.paymentTerms,
      worker.acceptedPayments,
    );

    const factors = this.matchingCriteria.pricing.factors;
    return (
      budgetScore * factors.budgetMatch +
      valueScore * factors.valueForMoney +
      paymentScore * factors.paymentTerms
    );
  }

  /**
   * Calculate reliability and quality score
   */
  calculateReliabilityScore(worker) {
    const rating = worker.rating || 0;
    const completionRate = worker.completionRate || 0;
    const responseTime = worker.averageResponseTime || 24; // hours
    const punctuality = worker.punctualityScore || 0;

    // Rating score (0-5 scale)
    const ratingScore = Math.min(rating / 5.0, 1.0);

    // Completion rate score (0-100% scale)
    const completionScore = completionRate / 100.0;

    // Response time score (faster is better)
    let responseScore = 1.0;
    if (responseTime <= 1)
      responseScore = 1.0; // Within 1 hour
    else if (responseTime <= 6)
      responseScore = 0.8; // Within 6 hours
    else if (responseTime <= 24)
      responseScore = 0.6; // Within 24 hours
    else responseScore = 0.3; // Longer than 24 hours

    // Punctuality score
    const punctualityScore = punctuality / 100.0;

    const factors = this.matchingCriteria.reliability.factors;
    return (
      ratingScore * factors.rating +
      completionScore * factors.completionRate +
      responseScore * factors.responseTime +
      punctualityScore * factors.punctuality
    );
  }

  /**
   * Calculate cultural compatibility score (Ghana-specific)
   */
  calculateCulturalScore(job, worker) {
    const jobLocation = this.parseLocation(job.location);
    const workerLocation = this.parseLocation(worker.location);

    // Language compatibility
    const languageScore = this.calculateLanguageCompatibility(
      jobLocation.region,
      worker.languages || ['English'],
    );

    // Cultural fit (same region/ethnic background understanding)
    const culturalFitScore = this.calculateCulturalFit(
      jobLocation,
      workerLocation,
      worker,
    );

    // Community reputation
    const communityScore = this.calculateCommunityReputation(worker);

    const factors = this.matchingCriteria.cultural.factors;
    return (
      languageScore * factors.languageMatch +
      culturalFitScore * factors.culturalFit +
      communityScore * factors.communityRep
    );
  }

  /**
   * Parse Ghana location string into structured data
   */
  parseLocation(locationString) {
    if (!locationString) return { region: 'Unknown', city: 'Unknown' };

    const parts = locationString.split(',').map((part) => part.trim());

    // Try to identify region and city
    let region = 'Unknown';
    let city = parts[0] || 'Unknown';

    for (const [regionName, regionData] of Object.entries(this.ghanaRegions)) {
      if (parts.some((part) => regionData.major_cities.includes(part))) {
        region = regionName;
        city =
          parts.find((part) => regionData.major_cities.includes(part)) || city;
        break;
      }
    }

    return {
      region,
      city,
      coordinates: this.ghanaRegions[region]?.coordinates,
    };
  }

  /**
   * Calculate distance between two locations (simplified)
   */
  calculateDistance(loc1, loc2) {
    if (!loc1.coordinates || !loc2.coordinates) {
      // Estimate based on region/city
      if (loc1.region === loc2.region) {
        return loc1.city === loc2.city ? 5 : 25; // Same region, different city
      }
      return 100; // Different regions
    }

    // Haversine formula for actual distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.coordinates.lat - loc1.coordinates.lat);
    const dLng = this.toRad(loc2.coordinates.lng - loc1.coordinates.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.coordinates.lat)) *
        Math.cos(this.toRad(loc2.coordinates.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate transport accessibility score
   */
  calculateTransportScore(jobLoc, workerLoc) {
    // Bonus for locations with good transport connections
    const jobTransport = this.ghanaRegions[
      jobLoc.region
    ]?.transport_hubs.includes(jobLoc.city);
    const workerTransport = this.ghanaRegions[
      workerLoc.region
    ]?.transport_hubs.includes(workerLoc.city);

    if (jobTransport && workerTransport) return 1.0;
    if (jobTransport || workerTransport) return 0.8;
    return 0.6;
  }

  /**
   * Calculate skill overlap percentage
   */
  calculateSkillOverlap(jobSkills, workerSkills) {
    if (!jobSkills.length) return 1.0;

    const matches = jobSkills.filter((skill) =>
      workerSkills.some(
        (workerSkill) =>
          workerSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(workerSkill.toLowerCase()),
      ),
    );

    return matches.length / jobSkills.length;
  }

  /**
   * Calculate Ghana certification score
   */
  calculateCertificationScore(jobCategory, workerCertifications) {
    let score = 0;
    let maxPossibleScore = 0;

    for (const [certName, certData] of Object.entries(
      this.ghanaCertifications,
    )) {
      if (
        certData.trades.includes(jobCategory) ||
        certData.trades.includes('all')
      ) {
        maxPossibleScore += certData.weight;

        if (workerCertifications.some((cert) => cert.includes(certName))) {
          score += certData.weight;
        }
      }
    }

    return maxPossibleScore > 0 ? score / maxPossibleScore : 0.5;
  }

  /**
   * Calculate language compatibility for Ghana
   */
  calculateLanguageCompatibility(jobRegion, workerLanguages) {
    let score = 0;

    for (const [language, langData] of Object.entries(this.ghanaLanguages)) {
      if (workerLanguages.includes(language)) {
        if (
          langData.regions.includes(jobRegion) ||
          langData.regions.includes('all')
        ) {
          score = Math.max(score, langData.speakers);
        }
      }
    }

    return score;
  }

  /**
   * Apply Ghana-specific boosting to matches
   */
  applyGhanaBoosting(matches, jobRequest) {
    return matches.map((match) => {
      let boost = 0;

      // Emergency job boost for quick responders
      if (jobRequest.urgent && match.worker.averageResponseTime <= 2) {
        boost += 0.1;
      }

      // Local hero boost (high community reputation)
      if (match.worker.communityRating >= 4.5) {
        boost += 0.05;
      }

      // Verified Ghana ID boost
      if (match.worker.ghanaCardVerified) {
        boost += 0.03;
      }

      // Traditional apprenticeship respect boost
      if (match.worker.apprenticeshipCompleted) {
        boost += 0.02;
      }

      match.matchScore.totalScore = Math.min(
        match.matchScore.totalScore + boost,
        1.0,
      );
      match.ghanaBoosts = boost;

      return match;
    });
  }

  /**
   * Add diversity to prevent clustering of similar workers
   */
  addDiversityScoring(matches) {
    const diverseMatches = [...matches];
    const seenAttributes = new Set();

    return diverseMatches.map((match, index) => {
      const attributes = [
        match.worker.location,
        match.worker.primarySkill,
        match.worker.priceRange,
      ].join('|');

      if (seenAttributes.has(attributes) && index > 5) {
        // Slightly reduce score for diversity
        match.matchScore.totalScore *= 0.95;
        match.diversityPenalty = true;
      }

      seenAttributes.add(attributes);
      return match;
    });
  }

  /**
   * Generate human-readable matching reasoning
   */
  generateMatchReasoning(matchScore) {
    const reasons = [];
    const breakdown = matchScore.breakdown;

    // Highlight strongest factors
    const sortedFactors = Object.entries(breakdown).sort(
      ([, a], [, b]) => b.weightedScore - a.weightedScore,
    );

    const topFactor = sortedFactors[0];

    if (topFactor[0] === 'skills' && topFactor[1].rawScore > 0.8) {
      reasons.push('Excellent skills match for your requirements');
    }

    if (breakdown.location.rawScore > 0.8) {
      reasons.push('Conveniently located near your project');
    }

    if (breakdown.reliability.rawScore > 0.8) {
      reasons.push('Highly reliable with excellent track record');
    }

    if (breakdown.pricing.rawScore > 0.8) {
      reasons.push('Competitive pricing within your budget');
    }

    if (breakdown.cultural.rawScore > 0.7) {
      reasons.push('Great cultural fit and local language compatibility');
    }

    return reasons.length > 0
      ? reasons
      : ['Good overall match for your project needs'];
  }

  /**
   * Generate recommendations for improving match quality
   */
  generateRecommendations(job, worker, matchScore) {
    const recommendations = [];

    if (matchScore.breakdown.pricing.rawScore < 0.6) {
      recommendations.push('Consider discussing flexible pricing options');
    }

    if (matchScore.breakdown.location.rawScore < 0.7) {
      recommendations.push('Factor in transportation costs and time');
    }

    if (matchScore.breakdown.skills.rawScore < 0.8) {
      recommendations.push(
        'Verify specific skill requirements during interview',
      );
    }

    return recommendations;
  }

  /**
   * Calculate additional helper scores
   */
  calculateExperienceScore(jobLevel, workerYears) {
    const levelRequirements = {
      entry: 0,
      intermediate: 2,
      experienced: 5,
      expert: 10,
    };

    const required = levelRequirements[jobLevel] || 0;
    const actual = workerYears || 0;

    if (actual >= required) return 1.0;
    if (actual >= required * 0.7) return 0.8;
    if (actual >= required * 0.5) return 0.6;
    return 0.4;
  }

  calculateSpecializationScore(category, specializations) {
    return specializations.includes(category) ? 1.0 : 0.5;
  }

  calculateValueScore(worker) {
    const rating = worker.rating || 3;
    const rate = worker.hourlyRate || 50;

    // Simple value calculation: rating per cost unit
    return Math.min(rating / 5 / (rate / 50), 1.0);
  }

  calculatePaymentCompatibility(jobPayment, workerPayments) {
    if (!jobPayment || !workerPayments) return 0.8;

    const overlap = jobPayment.filter((method) =>
      workerPayments.includes(method),
    );
    return overlap.length > 0 ? 1.0 : 0.5;
  }

  calculateCulturalFit(jobLoc, workerLoc, worker) {
    let score = 0.5; // Base score

    // Same region bonus
    if (jobLoc.region === workerLoc.region) score += 0.3;

    // Local knowledge bonus
    if (worker.localExperience) score += 0.2;

    return Math.min(score, 1.0);
  }

  calculateCommunityReputation(worker) {
    const factors = [
      worker.communityRating || 3,
      worker.localRecommendations || 0,
      worker.repeatCustomers || 0,
    ];

    return Math.min(factors.reduce((sum, val) => sum + val) / 15, 1.0);
  }

  calculateConfidence(scores) {
    const variance =
      Object.values(scores).reduce((sum, score) => {
        const mean =
          Object.values(scores).reduce((a, b) => a + b) /
          Object.values(scores).length;
        return sum + Math.pow(score - mean, 2);
      }, 0) / Object.values(scores).length;

    return Math.max(0.5, 1 - variance);
  }
}

// Export singleton instance
export default new AIMatchingService();
