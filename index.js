'use strict';

var postcss = require ('postcss');
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
 * @param {boolean} [testerOptions.printWarnings = false] - If `true`, the tester
 *   will print all the warnings that each test case produces.
 * @return {function} ruleTester for the specified rule/options
 */
function ruleTester(rule, ruleName, testerOptions) {
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
        t.plan(1);
        postcssProcess(cssString).then(function(result) {
          var warnings = result.warnings();
          if (testerOptions.printWarnings) {
            warnings.forEach(function(warning) {
              t.comment('warning: ' + warning.text);
            });
          }
          t.equal(warnings.length, 0, prepender(description, 'should pass'));

        })
      });
    }

    /**
     * Checks that a CSS string is INVALID according to the
     * specified rule/options -- i.e. that a warning is registered
     * with the expected warning message.
     *
     * @param {string} cssString
     * @param {string|object} warning
     * @param {string} [warning.message]
     * @param {string} [warning.line]
     * @param {string} [warning.column]
     * @param {string} [description]
     */
    function notOk(cssString, warning, description) {
      test(testTitleStr(cssString), function(t) {
        var warningMessage = (typeof warning === 'string')
          ? warning
          : warning.message;
        t.plan(4)
        postcssProcess(cssString).then(function(result) {
          var warnings = result.warnings();

          if (testerOptions.printWarnings) {
            warnings.forEach(function(warning) {
              t.comment('warning: ' + warning.text);
            });
          }
          t.equal(warnings.length, 1, prepender(description, 'should warn'));
          t.equal(warnings[0].text, warningMessage,
            prepender(description, 'warning message should be "' + warningMessage + '"'));
          if (warning.line) {
            t.equal(warnings[0].line, warning.line,
              prepender(description, 'warning should be at line ' + warning.line));
          } else { t.pass('no line number expected'); }
          if (warning.column) {
            t.equal(warnings[0].column, warning.column,
              prepender(description, 'warning should be at column ' + warning.column));
          } else { t.pass('no column number expected'); }
        });
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
}

module.exports = ruleTester;

/**
 * The same as `ruleTester`, but sets the `printWarnings` option to `true`.
 */
module.exports.printWarnings = function(rule, ruleName, testerOptions) {
  testerOptions = testerOptions || {};
  testerOptions.printWarnings = true;
  return ruleTester(rule, ruleName, testerOptions);
}

function prepender(a, b) {
  if (a) {
    return a + ' ' + b;
  }
  return b;
}
