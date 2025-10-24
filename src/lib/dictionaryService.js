// Dictionary service for instant word validation
let dictionary = null;
let loading = false;
let loadPromise = null;

/**
 * Load the dictionary from the public folder
 * Returns a promise that resolves when dictionary is loaded
 */
export async function loadDictionary() {
  // If already loaded, return immediately
  if (dictionary) {
    return dictionary;
  }

  // If currently loading, return the existing promise
  if (loading) {
    return loadPromise;
  }

  loading = true;
  console.log('Loading dictionary...');
  const startTime = performance.now();

  loadPromise = fetch('/words.txt')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load dictionary');
      }
      return response.text();
    })
    .then(text => {
      // Create a Set for O(1) lookup performance
      dictionary = new Set(
        text
          .split('\n')
          .map(word => word.toLowerCase().trim())
          .filter(word => word.length > 0)
      );
      
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      console.log(`Dictionary loaded: ${dictionary.size} words in ${loadTime}ms`);
      
      loading = false;
      return dictionary;
    })
    .catch(error => {
      console.error('Error loading dictionary:', error);
      loading = false;
      throw error;
    });

  return loadPromise;
}

/**
 * Check if a word exists in the dictionary
 * @param {string} word - The word to validate
 * @returns {boolean} - True if word is valid
 */
export function isWordValid(word) {
  if (!dictionary) {
    console.warn('Dictionary not loaded yet');
    return false;
  }
  
  return dictionary.has(word.toLowerCase().trim());
}

/**
 * Get dictionary loading status
 * @returns {object} - Status object with loaded and size properties
 */
export function getDictionaryStatus() {
  return {
    loaded: dictionary !== null,
    loading: loading,
    size: dictionary ? dictionary.size : 0
  };
}

/**
 * Preload dictionary (call this on app initialization)
 */
export function preloadDictionary() {
  loadDictionary().catch(error => {
    console.error('Failed to preload dictionary:', error);
  });
}
