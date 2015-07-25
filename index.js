'use strict';

var postcss = require('postcss');
var test = require('tape');

/**
 * Create a ruleTester for a specified rule.
 *
 * The ruleTester is a function accepting options and a callback.
 * The callback is passed on object exposing `ok` and `notOk` functions,
 * which check CSS strings against the rule configured with the specified options.
 *
 * @param {function} rule
 * @param {string} ruleName
 * @param {object} [testerOptions]
 * @param {function[]} [testerOptions.preceedingPlugins] - Array of PostCSS plugins to
 *   run the CSS string through *before* linting it
 * @param {boolean} [testerOptions.escapeCss = true] - If `false`, the CSS string printed
 *   to the console will not be escaped.
 *   This is useful if you want to read newlines and indentation.
 * @return {function} ruleTester for the specified rule/options
 */
module.exports = function(rule, ruleName, testerOptions) {
  testerOptions = testerOptions || {};
  testerOptions.escapeCss = testerOptions.escapeCss !== false;

  return ruleTester;

  function ruleTester(rulePrimaryOptions, ruleSecondaryOptions, cb) {
    if (typeof ruleSecondaryOptions === 'function') {
      cb = ruleSecondaryOptions;
      ruleSecondaryOptions = null;
    }

    var ruleOptionsString = (rulePrimaryOptions) ? JSON.stringify(rulePrimaryOptions) : '';
    if (ruleOptionsString && ruleSecondaryOptions) {
      ruleOptionsString += ', ' + JSON.stringify(ruleSecondaryOptions);
    }

    cb({ ok: ok, notOk: notOk });

    /**
     * Checks that a CSS string is valid according to the
     * specified rule/options.
     *
     * @param {string} cssString
     * @param {string} [description]
     */
    function ok(cssString, description) {
      test(testTitleStr(cssString), function(t) {
        var result = postcssProcess(cssString);
        t.equal(result.warnings().length, 0, prepender(description, 'should pass'));
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
      test(testTitleStr(cssString), function(t) {
        var result = postcssProcess(cssString);
        var warnings = result.warnings();
        t.equal(warnings.length, 1, prepender(description, 'should warn'));
        if (warnings.length === 1) {
          t.equal(warnings[0].text, warningMessage,
            prepender(description, 'should report "' + warningMessage + '"'));
        } else {
          t.pass('no warning to test');
        }
        t.end();
      });
    }

    function postcssProcess(cssString) {
      var processor = postcss();

      if (testerOptions.preceedingPlugins) {
        testerOptions.preceedingPlugins.forEach(function(plugin) {
          processor.use(plugin);
        });
      }

      return processor
        .use(rule(rulePrimaryOptions, ruleSecondaryOptions))
        .process(cssString);
    }

    function testTitleStr(css) {
      var result = '\ncss: ';
      if (testerOptions.escapeCss) {
        result += JSON.stringify(css);
      } else {
        result += '\n' + css;
      }
      result += '\nrule: ' + ruleName;
      result += '\noptions: ' + ruleOptionsString;
      return result;
    }
  }
};

function prepender(a, b) {
  if (a) {
    return a + ' ' + b;
  }
  return b;
}
