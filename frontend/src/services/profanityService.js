import { Filter } from 'bad-words';

// Initialize the bad-words filter
const filter = new Filter();

// Add any custom bad words (if needed)
const customBadwords = [
  // Add custom bad words here
];

filter.addWords(...customBadwords);

/**
 * Checks if text contains profanity
 * @param {string} text - The text to check
 * @returns {boolean} - True if profanity is found, false otherwise
 */
export const hasProfanity = (text) => {
  if (!text) return false;
  return filter.isProfane(text);
};

/**
 * Cleans text by replacing profanity with ***
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
export const cleanText = (text) => {
  if (!text) return '';
  return filter.clean(text);
};

/**
 * API call to check for profanity (for server-side validation)
 * @param {string} text - The text to check
 * @returns {Promise<boolean>} - Resolves to true if profanity is found
 */
export const checkProfanity = async (text) => {
  try {
    // First check client-side
    if (hasProfanity(text)) {
      return true;
    }
    
    // Optionally, you can also verify with a server-side check
    // const response = await api.post('/api/utils/check-profanity', { text });
    // return response.data.hasProfanity;
    
    return false;
  } catch (error) {
    console.error('Error checking profanity:', error);
    // Fail safe - if there's an error, assume there's profanity
    return true;
  }
};

export default {
  hasProfanity,
  cleanText,
  checkProfanity,
};
