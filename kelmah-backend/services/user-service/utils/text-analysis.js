const axios = require('axios');
const config = require('../config');

/**
 * List of keywords that might indicate spam or inappropriate content
 */
const SUSPICIOUS_KEYWORDS = [
  'scam', 'fraud', 'fake', 'spam', 'virus', 'hack', 'buy now', 'click here',
  'lottery', 'prize', 'winner', 'free', 'discount', 'offer', 'limited time',
  'urgent', 'guaranteed', 'promotion', 'investment', 'opportunity'
];

/**
 * Analyze text for sentiment, spam, and inappropriate content
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeText(text) {
  try {
    // First do basic analysis with internal functions
    const internalAnalysis = performBasicTextAnalysis(text);
    
    // If external NLP service is configured, use it for more accurate analysis
    let externalAnalysis = {};
    if (config.AI_TEXT_ANALYSIS_ENABLED && text.length > 0) {
      try {
        externalAnalysis = await performExternalTextAnalysis(text);
      } catch (error) {
        console.error('Error with external text analysis:', error);
        // Continue with internal analysis only
      }
    }
    
    // Combine results, prioritizing external analysis when available
    return {
      inappropriateScore: externalAnalysis.inappropriateScore || internalAnalysis.inappropriateScore,
      spamScore: externalAnalysis.spamScore || internalAnalysis.spamScore,
      sentimentScore: externalAnalysis.sentimentScore || internalAnalysis.sentimentScore,
      qualityScore: externalAnalysis.qualityScore || internalAnalysis.qualityScore,
      flaggedKeywords: internalAnalysis.flaggedKeywords
    };
  } catch (error) {
    console.error('Text analysis error:', error);
    
    // Return neutral analysis in case of error
    return {
      inappropriateScore: 0,
      spamScore: 0,
      sentimentScore: 0,
      qualityScore: 0.5,
      flaggedKeywords: []
    };
  }
}

/**
 * Perform basic text analysis using internal functions
 * @param {string} text - The text to analyze
 * @returns {Object} Analysis results
 */
function performBasicTextAnalysis(text) {
  if (!text || typeof text !== 'string') {
    return {
      inappropriateScore: 0,
      spamScore: 0,
      sentimentScore: 0,
      qualityScore: 0.5,
      flaggedKeywords: []
    };
  }
  
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);
  const wordCount = words.length;
  
  // Check for suspicious keywords
  const flaggedKeywords = SUSPICIOUS_KEYWORDS.filter(keyword => 
    normalizedText.includes(keyword.toLowerCase())
  );
  
  // Calculate basic spam score
  let spamScore = Math.min(flaggedKeywords.length / 5, 1);
  
  // Check for excessive capitalization (shouting)
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const capsRatio = text.length > 0 ? capsCount / text.length : 0;
  if (capsRatio > 0.3 && text.length > 20) {
    spamScore += 0.2;
  }
  
  // Check for excessive punctuation
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const punctuationRatio = text.length > 0 ? 
    (exclamationCount + questionCount) / text.length : 0;
  
  if (punctuationRatio > 0.1 && text.length > 20) {
    spamScore += 0.2;
  }
  
  // Cap spam score at 1
  spamScore = Math.min(spamScore, 1);
  
  // Simple sentiment analysis
  let positiveWords = 0;
  let negativeWords = 0;
  
  const POSITIVE_WORDS = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'helpful', 'professional', 'recommended', 'satisfied'];
  const NEGATIVE_WORDS = ['bad', 'poor', 'terrible', 'awful', 'worst', 'unhappy', 'disappointed', 'unprofessional', 'avoid', 'waste'];
  
  POSITIVE_WORDS.forEach(word => {
    if (normalizedText.includes(word)) positiveWords++;
  });
  
  NEGATIVE_WORDS.forEach(word => {
    if (normalizedText.includes(word)) negativeWords++;
  });
  
  let sentimentScore = 0;
  if (wordCount > 0) {
    sentimentScore = ((positiveWords - negativeWords) / wordCount) * 2; // Scale to approximately -1 to 1
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore)); // Clamp between -1 and 1
  }
  
  // Evaluate language quality (simple heuristics)
  let qualityScore = 0.5; // Default neutral
  
  // Too short is suspicious
  if (wordCount < 3) {
    qualityScore -= 0.2;
  }
  
  // Reasonable length suggests effort
  if (wordCount >= 10 && wordCount <= 200) {
    qualityScore += 0.1;
  }
  
  // Excessive length could be copy-pasted
  if (wordCount > 500) {
    qualityScore -= 0.1;
  }
  
  // Check for sentence structure (basic)
  const sentenceCount = (text.match(/[.!?]+/g) || []).length;
  if (wordCount > 5 && sentenceCount === 0) {
    qualityScore -= 0.1; // No proper sentences
  }
  
  // Default inappropriate score - this is difficult to determine without NLP
  // For basic implementation, we'll use a fraction of the spam score
  const inappropriateScore = spamScore * 0.5;
  
  // Ensure scores are within bounds
  return {
    inappropriateScore: Math.max(0, Math.min(1, inappropriateScore)),
    spamScore: Math.max(0, Math.min(1, spamScore)),
    sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
    qualityScore: Math.max(0, Math.min(1, qualityScore)),
    flaggedKeywords
  };
}

/**
 * Perform advanced text analysis using external NLP service
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} Analysis results
 */
async function performExternalTextAnalysis(text) {
  try {
    // Check if AI analysis is enabled in config
    if (!config.AI_TEXT_ANALYSIS_ENABLED) {
      throw new Error('External AI text analysis is disabled');
    }
    
    // Use external NLP service (e.g., Google Cloud Natural Language, AWS Comprehend, etc.)
    // This is a placeholder - implement based on your chosen NLP service
    const response = await axios.post(config.AI_TEXT_ANALYSIS_ENDPOINT, {
      text,
      apiKey: config.AI_TEXT_ANALYSIS_API_KEY
    });
    
    if (response.data && response.data.success) {
      return {
        inappropriateScore: response.data.toxicity || 0,
        spamScore: response.data.spam || 0,
        sentimentScore: response.data.sentiment || 0,
        qualityScore: response.data.quality || 0.5
      };
    }
    
    throw new Error('External text analysis failed or returned invalid data');
  } catch (error) {
    console.error('External text analysis error:', error);
    throw error;
  }
}

module.exports = {
  analyzeText
}; 