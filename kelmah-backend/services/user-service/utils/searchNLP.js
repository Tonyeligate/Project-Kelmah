/**
 * Natural Language Processing Utilities for Search
 * Enhances search capabilities with NLP features
 */

// Common job-related skills and their synonyms
const SKILL_SYNONYMS = {
  'javascript': ['js', 'ecmascript', 'frontend', 'front-end', 'coding'],
  'react': ['reactjs', 'react.js', 'frontend framework', 'ui library'],
  'node': ['nodejs', 'node.js', 'server-side', 'backend'],
  'python': ['py', 'python3', 'scripting', 'data science'],
  'design': ['ui design', 'ux design', 'graphic design', 'web design'],
  'marketing': ['digital marketing', 'seo', 'content marketing', 'advertising'],
  'writing': ['content writing', 'copywriting', 'blogging', 'article writing'],
  'php': ['php development', 'backend', 'lamp stack'],
  'accounting': ['bookkeeping', 'financial management', 'finance'],
  'teaching': ['tutoring', 'education', 'training', 'coaching'],
  'data entry': ['typing', 'data processing', 'administrative work'],
  'customer service': ['support', 'client service', 'helpdesk'],
  'sales': ['business development', 'lead generation', 'account management'],
  'translation': ['interpreter', 'localization', 'language services'],
  'mobile': ['android', 'ios', 'mobile development', 'app development'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'nosql'],
  'devops': ['ci/cd', 'containerization', 'docker', 'kubernetes', 'deployment'],
  'security': ['cybersecurity', 'infosec', 'penetration testing', 'security audit'],
  'seo': ['search engine optimization', 'keyword research', 'link building'],
  'research': ['market research', 'data analysis', 'business intelligence']
};

// Common job types and their synonyms
const JOB_TYPES = {
  'full-time': ['permanent', 'full time', 'fulltime', 'regular'],
  'part-time': ['part time', 'parttime', 'temporary', 'casual'],
  'contract': ['freelance', 'contractor', 'project-based', 'independent'],
  'remote': ['work from home', 'wfh', 'telecommute', 'virtual', 'remote work']
};

// Location indicators
const LOCATION_INDICATORS = [
  'in', 'near', 'around', 'at', 'from', 'within', 'nearby', 'located',
  'city', 'region', 'area', 'district', 'neighborhood', 'location'
];

// Salary/budget indicators
const BUDGET_INDICATORS = [
  'paying', 'salary', 'budget', 'rate', 'compensation', 'pay', 'paid',
  'per hour', 'hourly', 'per day', 'daily', 'weekly', 'monthly',
  'k', '$', 'dollar', 'cedi', 'GHS', 'USD', 'wage', 'cost'
];

/**
 * Extract skills from a natural language query
 * @param {string} query - Natural language search query
 * @returns {Array} - Extracted skills
 */
const extractSkills = (query) => {
  const normalizedQuery = query.toLowerCase();
  const foundSkills = [];
  
  // Check for direct skill matches and synonyms
  Object.keys(SKILL_SYNONYMS).forEach(skill => {
    if (normalizedQuery.includes(skill)) {
      foundSkills.push(skill);
    } else {
      // Check synonyms
      for (const synonym of SKILL_SYNONYMS[skill]) {
        if (normalizedQuery.includes(synonym)) {
          foundSkills.push(skill);
          break;
        }
      }
    }
  });
  
  return foundSkills;
};

/**
 * Extract job type from a natural language query
 * @param {string} query - Natural language search query
 * @returns {string|null} - Extracted job type
 */
const extractJobType = (query) => {
  const normalizedQuery = query.toLowerCase();
  
  for (const [jobType, synonyms] of Object.entries(JOB_TYPES)) {
    if (normalizedQuery.includes(jobType)) {
      return jobType;
    }
    
    for (const synonym of synonyms) {
      if (normalizedQuery.includes(synonym)) {
        return jobType;
      }
    }
  }
  
  return null;
};

/**
 * Extract location information from a natural language query
 * @param {string} query - Natural language search query
 * @returns {string|null} - Extracted location
 */
const extractLocation = (query) => {
  const words = query.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    if (LOCATION_INDICATORS.includes(words[i]) && i < words.length - 1) {
      // Assume the next 1-3 words might be a location
      let potentialLocation = words[i + 1];
      
      // Check if it's a multi-word location
      if (i < words.length - 2 && !LOCATION_INDICATORS.includes(words[i + 2]) && 
          !Object.keys(SKILL_SYNONYMS).includes(words[i + 2])) {
        potentialLocation += ' ' + words[i + 2];
        
        // Check for a third word
        if (i < words.length - 3 && !LOCATION_INDICATORS.includes(words[i + 3]) && 
            !Object.keys(SKILL_SYNONYMS).includes(words[i + 3])) {
          potentialLocation += ' ' + words[i + 3];
        }
      }
      
      return potentialLocation.trim();
    }
  }
  
  return null;
};

/**
 * Extract budget/salary range from a natural language query
 * @param {string} query - Natural language search query
 * @returns {Object|null} - Extracted min and max budget
 */
const extractBudget = (query) => {
  const normalizedQuery = query.toLowerCase();
  
  // Check for budget indicators
  let hasBudgetIndicator = false;
  for (const indicator of BUDGET_INDICATORS) {
    if (normalizedQuery.includes(indicator)) {
      hasBudgetIndicator = true;
      break;
    }
  }
  
  if (!hasBudgetIndicator) return null;
  
  // Extract numbers
  const numberRegex = /\b(\d+(?:[,.]\d+)?)\s*(?:k|cedi|cedis|GHS|\$|USD|dollar|dollars)?\b/g;
  const numbers = [];
  let match;
  
  while ((match = numberRegex.exec(normalizedQuery)) !== null) {
    numbers.push(parseFloat(match[1].replace(',', '')));
  }
  
  if (numbers.length === 0) return null;
  
  // Handle range expressions (like "between X and Y")
  if (normalizedQuery.includes('between') && numbers.length >= 2) {
    return {
      minBudget: Math.min(numbers[0], numbers[1]),
      maxBudget: Math.max(numbers[0], numbers[1])
    };
  }
  
  // Handle "less than X" or "under X"
  if (normalizedQuery.includes('less than') || normalizedQuery.includes('under')) {
    return {
      minBudget: null,
      maxBudget: numbers[0]
    };
  }
  
  // Handle "more than X" or "over X" or "at least X"
  if (normalizedQuery.includes('more than') || normalizedQuery.includes('over') || 
      normalizedQuery.includes('at least')) {
    return {
      minBudget: numbers[0],
      maxBudget: null
    };
  }
  
  // If we have exactly two numbers, assume it's a range
  if (numbers.length === 2) {
    return {
      minBudget: Math.min(numbers[0], numbers[1]),
      maxBudget: Math.max(numbers[0], numbers[1])
    };
  }
  
  // If we have just one number, it's either a minimum or an exact amount
  // We'll assume it's a minimum for searches
  return {
    minBudget: numbers[0],
    maxBudget: null
  };
};

/**
 * Extract search parameters from a natural language query
 * @param {string} query - Natural language search query
 * @returns {Object} - Extracted search parameters
 */
const parseNaturalLanguageQuery = (query) => {
  const searchParams = {
    keyword: query,
    skills: extractSkills(query),
    jobType: extractJobType(query),
    location: extractLocation(query),
    budget: extractBudget(query)
  };
  
  return searchParams;
};

/**
 * Generate search suggestions based on a partial query
 * @param {string} partialQuery - Partial search query
 * @returns {Array} - Suggested search completions
 */
const generateSearchSuggestions = (partialQuery) => {
  const normalizedQuery = partialQuery.toLowerCase();
  const suggestions = [];
  
  // Suggest skills
  for (const skill of Object.keys(SKILL_SYNONYMS)) {
    if (skill.startsWith(normalizedQuery)) {
      suggestions.push(skill);
    } else {
      // Check synonyms
      for (const synonym of SKILL_SYNONYMS[skill]) {
        if (synonym.startsWith(normalizedQuery)) {
          suggestions.push(synonym);
          break;
        }
      }
    }
  }
  
  // Suggest job types
  for (const jobType of Object.keys(JOB_TYPES)) {
    if (jobType.startsWith(normalizedQuery)) {
      suggestions.push(jobType);
    } else {
      // Check synonyms
      for (const synonym of JOB_TYPES[jobType]) {
        if (synonym.startsWith(normalizedQuery)) {
          suggestions.push(synonym);
          break;
        }
      }
    }
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
};

module.exports = {
  parseNaturalLanguageQuery,
  extractSkills,
  extractJobType,
  extractLocation,
  extractBudget,
  generateSearchSuggestions
}; 