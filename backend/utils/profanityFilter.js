const Filter = require('bad-words');

// Create a custom filter
const filter = new Filter();

// Add custom words to the blacklist
const customBadwords = [
  // Add any custom bad words here
];

filter.addWords(...customBadwords);

// Function to check if text contains profanity
const hasProfanity = (text) => {
  if (!text) return false;
  return filter.isProfane(text);
};

// Function to clean text (replace profanity with ***)
const cleanText = (text) => {
  if (!text) return '';
  return filter.clean(text);
};

// Middleware to check for profanity in request body
const checkProfanity = (req, res, next) => {
  const fieldsToCheck = ['name', 'description', 'comment', 'review', 'title', 'content'];
  
  for (const field of fieldsToCheck) {
    if (req.body[field] && hasProfanity(req.body[field])) {
      return res.status(400).json({
        success: false,
        error: `The ${field} contains inappropriate language. Please remove any offensive content.`
      });
    }
  }
  
  next();
};

module.exports = {
  hasProfanity,
  cleanText,
  checkProfanity
};
