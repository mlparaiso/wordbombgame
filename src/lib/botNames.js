/**
 * Bot name generation with animal themes
 * Format: [Adjective][Animal] (e.g., SwiftFox, LazyPanda)
 */

const ADJECTIVES = [
  'Swift', 'Lazy', 'Clever', 'Brave', 'Quiet', 'Wild', 'Happy', 'Angry',
  'Cold', 'Warm', 'Sleepy', 'Jumpy', 'Sneaky', 'Mighty', 'Tiny', 'Giant',
  'Quick', 'Slow', 'Wise', 'Silly', 'Fierce', 'Gentle', 'Proud', 'Shy',
  'Bold', 'Calm', 'Crazy', 'Cool', 'Dark', 'Bright', 'Lucky', 'Dizzy',
  'Grumpy', 'Jolly', 'Nimble', 'Rusty', 'Shiny', 'Smooth', 'Spiky', 'Fluffy'
];

const ANIMALS = [
  'Dog', 'Cat', 'Fox', 'Bear', 'Lion', 'Tiger', 'Wolf', 'Panda', 'Rabbit', 'Mouse',
  'Eagle', 'Hawk', 'Raven', 'Owl', 'Penguin', 'Dolphin', 'Shark', 'Whale', 'Seal', 'Otter',
  'Deer', 'Moose', 'Elk', 'Zebra', 'Giraffe', 'Elephant', 'Rhino', 'Hippo', 'Koala', 'Sloth',
  'Monkey', 'Gorilla', 'Cheetah', 'Leopard', 'Jaguar', 'Lynx', 'Cougar', 'Badger', 'Raccoon', 'Squirrel'
];

/**
 * Generate a random bot name
 * @param {Array<string>} existingNames - Names already in use to avoid duplicates
 * @returns {string} A unique bot name in format [Adjective][Animal]
 */
export const generateBotName = (existingNames = []) => {
  const maxAttempts = 100;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const name = `${adjective}${animal}`;
    
    // Check if name is unique
    if (!existingNames.includes(name)) {
      return name;
    }
    
    attempts++;
  }
  
  // Fallback: add number suffix if all combinations exhausted
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${adjective}${animal}${randomNum}`;
};

/**
 * Generate multiple unique bot names
 * @param {number} count - Number of names to generate
 * @param {Array<string>} existingNames - Names already in use
 * @returns {Array<string>} Array of unique bot names
 */
export const generateBotNames = (count, existingNames = []) => {
  const names = [];
  const allNames = [...existingNames];
  
  for (let i = 0; i < count; i++) {
    const name = generateBotName(allNames);
    names.push(name);
    allNames.push(name);
  }
  
  return names;
};
