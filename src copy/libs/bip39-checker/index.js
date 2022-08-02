'use strict';

var LevensteinDistance = require('./levenstein_distance');
var bip39 = require('bip39');

module.exports = {
  normalize: normalize,
  suggest: suggest,
  languages: ['chinese_simplified', 'chinese_traditional', 'english', 'french', 'italian', 'japanese', 'korean', 'spanish'],
  wordlist: function wordlist(language) {
    return language ? wordlists[language] : wordlists;
  },
  validSeed: validSeed,
  assertValidSeed: assertValidSeed,
  checkWords: checkWords,
  validWordlist: validWordlist,
  bip39: bip39
};

var wordlists = {
  chinese_simplified: require('bip39/src/wordlists/chinese_simplified.json'),
  chinese_traditional: require('bip39/src/wordlists/chinese_traditional.json'),
  english: require('bip39/src/wordlists/english.json'),
  french: require('bip39/src/wordlists/french.json'),
  italian: require('bip39/src/wordlists/italian.json'),
  japanese: require('bip39/src/wordlists/japanese.json'),
  korean: require('bip39/src/wordlists/korean.json'),
  spanish: require('bip39/src/wordlists/spanish.json')

  /**
    @summary Character cleansing: printable characters, all lowercase, trim.

    @description Filter and remove invalid characters or extraneous spaces from BIP-0039 word phrases. Future implementation can assume that this method will not change any word in the language files (@see index.test.js).

    @retrun {string} normalized seed
  */
};function normalize(seed) {
  if (typeof seed !== 'string') {
    throw new TypeError('seed string required');
  }

  // TODO? use unorm module until String.prototype.normalize gets better browser support
  seed = seed.normalize('NFKD'); // Normalization Form: Compatibility Decomposition
  seed = seed.replace(/\s+/g, ' '); // Remove multiple spaces in a row
  seed = seed.toLowerCase();
  seed = seed.trim();
  return seed;
}

var vowelRe = /[aeiou]/g;
var novowels = function novowels(word) {
  return word.replace(vowelRe, '');
};

/**
  Find the best matching word or words in the list.

  @return {Array|boolean} 0 or more suggestions, true when perfect match
*/
function suggest() {
  var word = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$maxSuggestions = _ref.maxSuggestions,
      maxSuggestions = _ref$maxSuggestions === undefined ? 15 : _ref$maxSuggestions,
      _ref$language = _ref.language,
      language = _ref$language === undefined ? 'english' : _ref$language;

  word = word.trim().toLowerCase();
  var nword = normalize(word);
  var wordlist = validWordlist(language);

  if (word === '') {
    return [];
  }

  // Words that begin the same, also handles perfect match
  var match = false;
  var matches = wordlist.reduce(function (arr, w) {
    if (w === word || match) {
      match = true;
      return;
    }
    if (w.indexOf(nword) === 0 && arr.length < 10) {
      arr.push(w);
    }

    return arr;
  }, []);
  if (match) {
    return true;
  }

  // Levenshtein distance
  if (!/chinese/.test(language)) {
    var levenstein = LevensteinDistance(wordlist);
    var lwords = levenstein(nword, { threshold: 0.5, language: language });
    lwords.forEach(function (w) {
      matches.push(w);
    });
  }

  if (language === 'english') {
    // Vowels are almost useless
    var nvword = novowels(nword);
    if (nvword !== '') {
      wordlist.reduce(function (arr, w) {
        var score = novowels(w).indexOf(nvword);
        if (score !== -1) {
          arr.push([score, w]);
        }
        return arr;
      }, []).sort(function (a, b) {
        return Math.sign(a[0], b[0]);
      }).map(function (a) {
        return a[1];
      }).forEach(function (w) {
        matches.push(w);
      });
    }
  }

  var dedupe = {};
  var finalMatches = matches.filter(function (item) {
    return dedupe[item] ? false : dedupe[item] = true;
  });

  // console.log('suggest finalMatches', word, finalMatches)
  return finalMatches.slice(0, maxSuggestions);
}

/**
    @typedef {object} Validity
    @property {boolean} Validity.valid
    @property {string} Validity.error
*/
/**
    User interfaces should check the seed after data entry.  When a checksum is invalid, warn the user and ask if they would like to use it anyway.  This way you can still use phrases created in new future languages.

    @arg {string} mnemonicSeed
    @arg {string} [language = 'english']

    @example assert(seeder.validSeed(mnemonicSeed))
    @return {Validity}
*/
function validSeed(mnemonicSeed) {
  var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'english';

  try {
    mnemonicSeed = normalize(mnemonicSeed);
    assertValidSeed(mnemonicSeed, language);
    return {
      valid: true,
      error: null
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message
    };
  }
}

/**
    Like validSeed, except an Error will be thrown if the seed is invalid.

    @throws {Error} 'Invalid mnemonic seed(...)'
*/
function assertValidSeed(mnemonicSeed) {
  var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'english';

  if (!checkWords(mnemonicSeed, language)) {
    throw new Error('Invalid mnemonic seed');
  }
  var wordlist = validWordlist(language);
  if (!bip39.validateMnemonic(mnemonicSeed, wordlist)) {
    var words = mnemonicSeed.split(' ').length;
    // user forgot to quote command line arg
    var shortStr = words < 11 ? '.  Mnemonic seeds are usually 12 words or more but this seed is only ' + words + ' words.' : '';
    throw new Error('Invalid mnemonic seed checksum' + shortStr);
  }
}

/**
  @arg {string} seed - single word or combination of words from the wordlist
  @arg {string} [language = 'english'] - Language dictionary to test seed against

  @return {boolean} true if seed contains no words or all valid words
  @throws {Error} 'Missing wordlist for ${language}'
*/
function checkWords() {
  var seed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'english';

  var words = seed.split(' ');
  var wordlist = validWordlist(language);
  var word = void 0;
  while ((word = words.pop()) != null) {
    var idx = wordlist.findIndex(function (w) {
      return w === word;
    });
    if (idx === -1) {
      return false;
    }
  }
  return true;
}

/**
  @throws {Error} 'Missing wordlist for ${language}'
*/
function validWordlist(language) {
  var wordlist = wordlists[language];
  if (!wordlist) {
    throw new Error('Missing wordlist for language ' + language);
  }
  return wordlist;
}
