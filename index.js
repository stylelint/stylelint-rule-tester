'use strict';

var postcss = require('postcss');
var test = require('tape');

/**
 * Create a ruleTester for a specified rule.
 *
 * The ruleTester is a function accepting options and a callback.
 * The callback is passed on object exposing functions that
 * check CSS strings against the rule configured with the specified options.
 *
 * `ruleTester.only()` has the same API but uses `test.only()` from
 * tape -- meaning that those tests run exclusively.
 *
 * @param {function} rule
 * @param {string} ruleName
 * @param {function[]} [preceedingPlugins] - Array of PostCSS plugins to
 *   run the CSS string through *before* linting it
 * @return {function} ruleTester for the specified rule
 */
module.exports = function(rule, ruleName, preceedingPlugins) {

  function ruleTester(primaryOptions, secondaryOptions, cb) {
    if (typeof secondaryOptions === 'function') {
      cb = secondaryOptions;
      secondaryOptions = null;
    }
    return createRuleTester(test, primaryOptions, secondaryOptions, cb);
  }

  ruleTester.only = function(primaryOptions, secondaryOptions, cb) {
    if (typeof secondaryOptions === 'function') {
      cb = secondaryOptions;
      secondaryOptions = null;
    }
    return createRuleTester(test.only, primaryOptions, secondaryOptions, cb);
  };

  return ruleTester;

  function createRuleTester(testFn, primaryOptions, secondaryOptions, cb) {
    var optionsString = JSON.stringify(primaryOptions);
    if (secondaryOptions) {
      optionsString += ', ' + JSON.stringify(secondaryOptions);
    }
    var ruleOptionsOutput = ruleName + ': ' + optionsString;
    cb({ ok: ok, notOk: notOk });

    /**
     * Checks that a CSS string is valid according to the
     * specified rule/options.
     *
     * @param {string} cssString
     * @param {string} [description]
     */
    function ok(cssString, description) {
      testFn('pass: ' + JSON.stringify(cssString), function(t) {
        t.comment(ruleOptionsOutput);
        var result = postcssProcess(cssString);
        t.equal(result.warnings().length, 0, [description, 'should pass'].join(' '));
        t.end();
      });
    }

    /**
     * Checks that a CSS string is INVALID according to the
     * specified rule/options -- i.e. that a warning is registered
     * with the expected warning message.
     *
     * @param {string} cssString
     * @param {string} warningMessage
     * @param {string} [description]
     */
    function notOk(cssString, warningMessage, description) {
      testFn('fail: ' + JSON.stringify(cssString), function(t) {
        t.comment(ruleOptionsOutput);
        var result = postcssProcess(cssString);
        var warnings = result.warnings();
        t.equal(warnings.length, 1, [description, 'should warn'].join(' '));
        if (warnings.length === 1) {
          var finishedDescription = [
            description,
            'should report "' + warningMessage + '"',
          ].join(' ');
          t.equal(warnings[0].text, warningMessage, finishedDescription);
        } else {
          t.pass('no warning to test');
        }
        t.end();
      });
    }

    function postcssProcess(cssString) {
      var processor = postcss();

      if (preceedingPlugins) {
        preceedingPlugins.forEach(function(plugin) {
          processor.use(plugin);
        });
      }

      return processor
        .use(rule(primaryOptions, secondaryOptions))
        .process(cssString);
    }
  }
};
