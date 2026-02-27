import { isWordValid, getDictionaryStatus } from './dictionaryService';

/**
 * Comprehensive list of country names (lowercase) that are not allowed as answers.
 * Includes UN member states, observer states, and widely recognised territories.
 */
const COUNTRY_NAMES = new Set([
  'afghanistan', 'albania', 'algeria', 'andorra', 'angola', 'antiguaandbarbuda',
  'argentina', 'armenia', 'australia', 'austria', 'azerbaijan',
  'bahamas', 'bahrain', 'bangladesh', 'barbados', 'belarus', 'belgium',
  'belize', 'benin', 'bhutan', 'bolivia', 'bosniaandherzegovina', 'botswana',
  'brazil', 'brunei', 'bulgaria', 'burkinafaso', 'burundi',
  'caboverde', 'cambodia', 'cameroon', 'canada', 'centralafricanrepublic',
  'chad', 'chile', 'china', 'colombia', 'comoros', 'congo',
  'costarica', 'croatia', 'cuba', 'cyprus', 'czechia',
  'denmark', 'djibouti', 'dominica', 'dominicanrepublic',
  'ecuador', 'egypt', 'elsalvador', 'equatorialguinea', 'eritrea',
  'estonia', 'eswatini', 'ethiopia',
  'fiji', 'finland', 'france',
  'gabon', 'gambia', 'georgia', 'germany', 'ghana', 'greece',
  'grenada', 'guatemala', 'guinea', 'guineabissau', 'guyana',
  'haiti', 'honduras', 'hungary',
  'iceland', 'india', 'indonesia', 'iran', 'iraq', 'ireland',
  'israel', 'italy',
  'jamaica', 'japan', 'jordan',
  'kazakhstan', 'kenya', 'kiribati', 'kuwait', 'kyrgyzstan',
  'laos', 'latvia', 'lebanon', 'lesotho', 'liberia', 'libya',
  'liechtenstein', 'lithuania', 'luxembourg',
  'madagascar', 'malawi', 'malaysia', 'maldives', 'mali', 'malta',
  'marshallislands', 'mauritania', 'mauritius', 'mexico', 'micronesia',
  'moldova', 'monaco', 'mongolia', 'montenegro', 'morocco', 'mozambique',
  'myanmar',
  'namibia', 'nauru', 'nepal', 'netherlands', 'newzealand', 'nicaragua',
  'niger', 'nigeria', 'niue', 'northkorea', 'northmacedonia', 'norway',
  'oman',
  'pakistan', 'palau', 'palestine', 'panama', 'papuanewguinea', 'paraguay',
  'peru', 'philippines', 'poland', 'portugal',
  'qatar',
  'romania', 'russia', 'rwanda',
  'saintkittsandnevis', 'saintlucia', 'saintvincentandthegrenadines',
  'samoa', 'sanmarino', 'saotomeandprincipe', 'saudiarabia', 'senegal',
  'serbia', 'seychelles', 'sierraleone', 'singapore', 'slovakia', 'slovenia',
  'solomonislands', 'somalia', 'southafrica', 'southkorea', 'southsudan',
  'spain', 'srilanka', 'sudan', 'suriname', 'sweden', 'switzerland', 'syria',
  'taiwan', 'tajikistan', 'tanzania', 'thailand', 'timorleste', 'togo',
  'tonga', 'trinidadandtobago', 'tunisia', 'turkey', 'turkmenistan', 'tuvalu',
  'uganda', 'ukraine', 'unitedarabemirates', 'unitedkingdom', 'unitedstates',
  'uruguay', 'uzbekistan',
  'vanuatu', 'vaticancity', 'venezuela', 'vietnam',
  'yemen',
  'zambia', 'zimbabwe',
  // Common short/alternate forms that would actually appear as single words
  'afghan', 'albanian', 'algerian', 'american', 'andorran', 'angolan',
  'argentine', 'armenian', 'australian', 'austrian', 'azerbaijani',
  'bahamian', 'bahraini', 'bangladeshi', 'barbadian', 'belarusian',
  'belgian', 'belizean', 'beninese', 'bhutanese', 'bolivian', 'bosnian',
  'botswanan', 'brazilian', 'bruneian', 'bulgarian', 'burkinabe', 'burundian',
  'cambodian', 'cameroonian', 'canadian', 'chadian', 'chilean', 'chinese',
  'colombian', 'comorian', 'congolese', 'croatian', 'cuban', 'cypriot',
  'czech', 'danish', 'djiboutian', 'dominican', 'ecuadorian', 'egyptian',
  'eritrean', 'estonian', 'ethiopian', 'fijian', 'finnish', 'french',
  'gabonese', 'gambian', 'georgian', 'german', 'ghanaian', 'greek',
  'grenadian', 'guatemalan', 'guinean', 'guyanese', 'haitian', 'honduran',
  'hungarian', 'icelandic', 'indian', 'indonesian', 'iranian', 'iraqi',
  'irish', 'israeli', 'italian', 'jamaican', 'japanese', 'jordanian',
  'kazakh', 'kenyan', 'korean', 'kuwaiti', 'kyrgyz',
  'laotian', 'latvian', 'lebanese', 'liberian', 'libyan', 'lithuanian',
  'luxembourgish', 'malagasy', 'malawian', 'malaysian', 'maldivian',
  'malian', 'maltese', 'mauritanian', 'mauritian', 'mexican',
  'moldovan', 'monacan', 'mongolian', 'montenegrin', 'moroccan',
  'mozambican', 'namibian', 'nepalese', 'dutch', 'nicaraguan', 'nigerian',
  'nigerien', 'norwegian', 'omani', 'pakistani', 'palauan', 'palestinian',
  'panamanian', 'paraguayan', 'peruvian', 'philippine', 'polish',
  'portuguese', 'qatari', 'romanian', 'russian', 'rwandan', 'samoan',
  'saudi', 'senegalese', 'serbian', 'singaporean', 'slovak', 'slovenian',
  'somali', 'spanish', 'sudanese', 'surinamese', 'swedish', 'swiss',
  'syrian', 'taiwanese', 'tajik', 'tanzanian', 'thai', 'timorese',
  'togolese', 'tongan', 'tunisian', 'turkish', 'turkmen', 'tuvaluan',
  'ugandan', 'ukrainian', 'uruguayan', 'uzbek', 'vanuatuan', 'venezuelan',
  'vietnamese', 'yemeni', 'zambian', 'zimbabwean',
]);

/**
 * Checks whether a word (lowercase) is a country name.
 * @param {string} word
 * @returns {boolean}
 */
export const isCountryName = (word) => COUNTRY_NAMES.has(word.toLowerCase());

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

  // Reject country names
  if (isCountryName(trimmedWord)) {
    return { valid: false, message: 'Country names are not allowed!' };
  }
  
  // Validate with local dictionary (instant!)
  const isValidWord = validateWord(trimmedWord);
  
  if (!isValidWord) {
    return { valid: false, message: 'Not a valid English word!' };
  }
  
  return { valid: true, message: 'Valid word!' };
};
