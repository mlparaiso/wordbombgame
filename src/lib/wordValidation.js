/**
 * Validates a word using the Datamuse API
 * @param {string} word - The word to validate
 * @returns {Promise<boolean>} - True if word is valid, false otherwise
 */
export const validateWord = async (word) => {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=1`
    );
    
    if (!response.ok) {
      console.warn('Datamuse API error, allowing word by default');
      return true; // Allow word if API fails
    }
    
    const data = await response.json();
    
    // Check if the API returned the exact word
    if (data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase()) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Word validation error:', error);
    // If API fails, allow the word to avoid frustrating players
    return true;
  }
};

/**
 * Validates a word with basic checks before API call
 * @param {string} word - The word to validate
 * @param {string} requiredCombo - The letter combination that must be in the word
 * @param {string[]} usedWords - Array of previously used words
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export const validateWordComplete = async (word, requiredCombo, usedWords = []) => {
  const trimmedWord = word.trim().toLowerCase();
  
  // Basic validation
  if (trimmedWord.length < 3) {
    return { valid: false, message: 'Word must be at least 3 letters!' };
  }
  
  if (!trimmedWord.includes(requiredCombo.toLowerCase())) {
    return { valid: false, message: `Word must contain "${requiredCombo}"!` };
  }
  
  if (usedWords.includes(trimmedWord)) {
    return { valid: false, message: 'Word already used!' };
  }
  
  // Check if it contains only letters
  if (!/^[a-z]+$/i.test(trimmedWord)) {
    return { valid: false, message: 'Word must contain only letters!' };
  }
  
  // Validate with Datamuse API
  const isValidWord = await validateWord(trimmedWord);
  
  if (!isValidWord) {
    return { valid: false, message: 'Not a valid English word!' };
  }
  
  return { valid: true, message: 'Valid word!' };
};
