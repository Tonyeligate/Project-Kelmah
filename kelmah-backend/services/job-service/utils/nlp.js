/**
 * Natural Language Processing Utilities
 * Provides NLP functions for text analysis, entity extraction, and search enhancement
 */

const natural = require('natural');
const stopwords = require('stopwords').english;

// Create a tokenizer for splitting text into words
const tokenizer = new natural.WordTokenizer();

// Initialize word stemmer and metaphone for phonetic matching
const stemmer = natural.PorterStemmer;
const metaphone = natural.Metaphone;
metaphone.attach();

/**
 * NLP utilities for job search and text analysis
 */
const nlpUtils = {
  /**
   * Extract keywords from text by removing stopwords and stemming
   * 
   * @param {string} text - Input text
   * @returns {string[]} Array of keywords
   */
  extractKeywords: (text) => {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // Tokenize the text into words
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Filter out stopwords and non-alphanumeric tokens
    const filteredTokens = tokens
      .filter(token => 
        token.length > 2 && 
        !stopwords.includes(token) &&
        /^[a-z0-9]+$/i.test(token)
      );
    
    // Stem the tokens to get the base forms
    const stemmedTokens = filteredTokens.map(token => stemmer.stem(token));
    
    // Remove duplicates and return unique keywords
    return [...new Set(stemmedTokens)];
  },
  
  /**
   * Extract original (unstemmed) keywords from text
   * 
   * @param {string} text - Input text
   * @returns {string[]} Array of original keywords
   */
  extractOriginalKeywords: (text) => {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // Tokenize the text into words
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Filter out stopwords and non-alphanumeric tokens
    const filteredTokens = tokens
      .filter(token => 
        token.length > 2 && 
        !stopwords.includes(token) &&
        /^[a-z0-9]+$/i.test(token)
      );
    
    // Remove duplicates and return unique keywords
    return [...new Set(filteredTokens)];
  },
  
  /**
   * Classify entities in text (skills, locations, job titles, etc.)
   * 
   * @param {string} text - Input text
   * @param {Object} options - Classification options
   * @returns {Object} Classified entities
   */
  classifyEntities: (text, options = {}) => {
    // This is a simplified version - a production system would use a more robust NER model
    
    const jobTitlePatterns = [
      /\b(software|web|frontend|backend|full[\s-]?stack|mobile|ios|android|ui\/ux|graphic|product|ux|ui)\s+(developer|designer|engineer)\b/i,
      /\b(data\s+scientist|project\s+manager|product\s+manager|content\s+writer|marketing\s+specialist|social\s+media\s+manager)\b/i,
      /\b(copywriter|editor|analyst|consultant|specialist|coordinator|director|technician|administrator)\b/i
    ];
    
    const skillPatterns = [
      /\b(javascript|python|java|c\#|c\+\+|php|ruby|swift|kotlin|typescript|html|css|sql|nosql|react|angular|vue|node\.js|express|django|flask|laravel|spring|aws|azure|gcp)\b/i,
      /\b(photoshop|illustrator|figma|sketch|indesign|after\s+effects|premiere\s+pro|xd)\b/i,
      /\b(marketing|seo|sem|smm|content|copywriting|analytics|research|project\s+management|agile|scrum|kanban)\b/i
    ];
    
    const locationPatterns = [
      /\bin\s+([a-z\s]+(?:city|town))/i,
      /\b(?:at|in|near|around)\s+([a-z\s]+(?:,\s*[a-z]{2})?)\b/i,
      /\b([a-z]+\s+area)\b/i
    ];
    
    const companyPatterns = [
      /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
      /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/
    ];
    
    // Initialize entity categories
    const entities = {
      jobTitles: [],
      skills: [],
      locations: [],
      companies: []
    };
    
    // Extract job titles
    jobTitlePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.jobTitles.push(matches[0]);
      }
    });
    
    // Extract skills
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.skills.push(matches[0]);
      }
    });
    
    // Extract locations
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches[1]) {
        entities.locations.push(matches[1]);
      }
    });
    
    // Extract companies
    companyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches[1]) {
        entities.companies.push(matches[1]);
      }
    });
    
    // Remove duplicates
    for (const category in entities) {
      entities[category] = [...new Set(entities[category])];
    }
    
    return entities;
  },
  
  /**
   * Extract entities and keywords from search query
   * 
   * @param {string} query - Search query
   * @returns {Object} Object containing keywords and entities
   */
  extractEntities: async (query) => {
    // Get original keywords for search
    const keywords = nlpUtils.extractOriginalKeywords(query);
    
    // Classify entities in the query
    const entities = nlpUtils.classifyEntities(query);
    
    return {
      keywords,
      entities
    };
  },
  
  /**
   * Calculate similarity between two texts
   * 
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score between 0 and 1
   */
  calculateSimilarity: (text1, text2) => {
    if (!text1 || !text2) {
      return 0;
    }
    
    // Extract keywords from both texts
    const keywords1 = nlpUtils.extractKeywords(text1);
    const keywords2 = nlpUtils.extractKeywords(text2);
    
    // Calculate Jaccard similarity (intersection over union)
    const intersection = keywords1.filter(keyword => keywords2.includes(keyword));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return union.length === 0 ? 0 : intersection.length / union.length;
  },
  
  /**
   * Generate search suggestions based on input query
   * 
   * @param {string} query - Search query
   * @param {Object} options - Options for suggestion generation
   * @returns {Array} Array of search suggestions
   */
  generateSearchSuggestions: (query, options = {}) => {
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    // Extract keywords and entities from query
    const keywords = nlpUtils.extractOriginalKeywords(query);
    const entities = nlpUtils.classifyEntities(query);
    
    // Generate suggestions based on extracted information
    const suggestions = [];
    
    // Add job title suggestions
    if (entities.jobTitles.length > 0) {
      entities.jobTitles.forEach(title => {
        suggestions.push({
          type: 'jobTitle',
          text: `Jobs with title "${title}"`,
          query: `title:"${title}"`
        });
      });
    }
    
    // Add skill suggestions
    if (entities.skills.length > 0) {
      entities.skills.forEach(skill => {
        suggestions.push({
          type: 'skill',
          text: `Jobs requiring "${skill}" skills`,
          query: `skill:"${skill}"`
        });
      });
    }
    
    // Add location suggestions
    if (entities.locations.length > 0) {
      entities.locations.forEach(location => {
        suggestions.push({
          type: 'location',
          text: `Jobs in "${location}"`,
          query: `location:"${location}"`
        });
      });
    }
    
    // Add company suggestions
    if (entities.companies.length > 0) {
      entities.companies.forEach(company => {
        suggestions.push({
          type: 'company',
          text: `Jobs at "${company}"`,
          query: `company:"${company}"`
        });
      });
    }
    
    return suggestions;
  }
};

module.exports = nlpUtils;