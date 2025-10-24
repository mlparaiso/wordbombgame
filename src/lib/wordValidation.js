import { isWordValid, getDictionaryStatus } from './dictionaryService';

/**
 * Validates a word using the local dictionary
 * @param {string} word - The word to validate
 * @returns {boolean} - True if word is valid, false otherwise
 */
export const validateWord = (word) => {
  const status = getDictionaryStatus();
  
  if (!status.loaded) {
    console.warn('Dictionary not loaded yet, validation may fail');
    return false;
  }
  
  return isWordValid(word);
};

/**
 * Validates a word with basic checks before dictionary lookup
 * @param {string} word - The word to validate
 * @param {string} requiredCombo - The letter combination that must be in the word
 * @param {string[]} usedWords - Array of previously used words
 * @param {boolean} isMultiplayer - Whether this is a multiplayer game (default: false)
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export const validateWordComplete = async (word, requiredCombo, usedWords = [], isMultiplayer = false) => {
  const trimmedWord = word.trim().toLowerCase();
  
  // Basic validation - different minimums for single vs multiplayer
  const minLength = isMultiplayer ? 4 : 3;
  if (trimmedWord.length < minLength) {
    return { valid: false, message: `Word must be at least ${minLength} letters!` };
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
  
  // Validate with local dictionary (instant!)
  const isValidWord = validateWord(trimmedWord);
  
  if (!isValidWord) {
    return { valid: false, message: 'Not a valid English word!' };
  }
  
  return { valid: true, message: 'Valid word!' };
};
