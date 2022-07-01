'use strict';

/* eslint-env mocha */
var bip39 = require('bip39');
var assert = require('assert');
var LevensteinDistance = require('./levenstein_distance');

var _require = require('.'),
    normalize = _require.normalize,
    suggest = _require.suggest,
    wordlist = _require.wordlist,
    languages = _require.languages,
    checkWords = _require.checkWords,
    validSeed = _require.validSeed,
    assertValidSeed = _require.assertValidSeed,
    validWordlist = _require.validWordlist;

describe('Seed', function () {
  it('Normalize', function () {
    throws(function () {
      return normalize();
    }, /^seed string required$/);
    // Update README if these change:
    assert.equal('double spaces', normalize('double  spaces'), 'removes extra spaces');
    assert.equal('lowercase', normalize('Lowercase'), 'lowercase');
    assert.equal('trim', normalize('  trim  '), 'trim');
  });

  it('Suggests', function () {
    assert(suggest('quality') === true);
    assert(suggest('ágil', { language: 'spanish' }) === true);
    assert.equal(suggest('médula1', { language: 'spanish' })[0], 'médula');
    assert.equal(suggest('quality1')[0], 'quality');
    assert(suggest('').length === 0);
    assert(suggest('qua').length > 0);
    assert(suggest('seeder').length > 0);
    assert(suggest('aeiou').length === 0);
    assert(suggest('qlty').length === 1);
    LevensteinDistance.distance('', '');
  });

  it('Length', function () {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = languages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var lang = _step.value;

        assertLen(wordlist(lang));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  it('Check Words', function () {
    assert(checkWords('lazy dog', 'english'));
    assert(!checkWords('lazy dogma', 'english'));
    throws(function () {
      return validWordlist('pig_latin');
    }, /^Missing wordlist for language pig_latin$/);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = languages[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var lang = _step2.value;

        assertNormalized(lang);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  });

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop = function _loop() {
      var language = _step3.value;

      it('Word List: ' + language, function () {
        var words = validWordlist(language);
        var seed = bip39.generateMnemonic(undefined, undefined, words);
        assert(validSeed(seed, language));
      });
    };

    for (var _iterator3 = languages[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  it('Validate', function () {
    assert(/this seed is only 2 words/.test(validSeed('lazy dog').error));
    var seed = bip39.generateMnemonic();
    assert.equal(validSeed(seed + ' nonword').error, 'Invalid mnemonic seed');
    assert(/Invalid mnemonic seed checksum/.test(validSeed(seed + ' able').error));
    assert.equal(validSeed(null).error, 'seed string required');
    assert(validSeed(seed));
  });
});

var assertNormalized = function assertNormalized(lang) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = wordlist(lang)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var word = _step4.value;

      assert(word === normalize(word), 'word ' + word + ' in wordlist ' + lang + ' did not normalize');
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }
};
var assertLen = function assertLen(wordlist) {
  assert.equal(2048, wordlist.length, 'Expecting 2048 words, got ' + wordlist.length);
};

/* istanbul ignore next */
function throws(fn, match) {
  try {
    fn();
    assert(false, 'Expecting error');
  } catch (error) {
    if (!match.test(error.message)) {
      error.message = 'Error did not match ' + match + '\n' + error.message;
      throw error;
    }
  }
}
try {
  throws(function () {
    throw '1';
  }, /2/);
} catch (err) {
  // for code-coverage
}