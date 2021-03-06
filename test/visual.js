'use strict';

var ruleTester = require('..');
var scss = require('postcss-scss');

function noEmptyBlocksRule() {
  return function(root, result) {
    root.eachRule(check);
    root.eachAtRule(check);

    function check(statement) {
      if (statement.nodes !== undefined && statement.nodes.length === 0) {
        result.warn('Please, no empty blocks!', {
          node: statement,
          line: 6,
          column: 3,
        });
      }
    }
  };
}

var testRule = ruleTester(noEmptyBlocksRule, 'my-no-empty-blocks-rule');
var rejectionMessage = 'Please, no empty blocks!';

testRule('always', function(tr) {
  tr.ok('', 'empty');
  tr.ok('@import \'foo.css\';', 'blockless at-rule');

  tr.ok('a { color: pink; }', 'rule with a declaration');
  tr.ok('@media print { a { color: pink; } }', 'at-rule with a rule with a declaration');

  tr.notOk('a {}', rejectionMessage, 'empty rule block');
  tr.notOk('a { }', rejectionMessage, 'rule block with a single space');
  tr.notOk('a {\n}', rejectionMessage, 'rule block with a newline');
  tr.notOk('@media print {}', rejectionMessage, 'empty at-rule block');
  tr.notOk('@media print { a {} }', {
    message: rejectionMessage,
    line: 6,
    column: 3,
  }, 'at-rule block with an empty rule block');
});

var testRuleScss = ruleTester(noEmptyBlocksRule, 'my-no-empty-blocks-rule', {
  postcssOptions: {
    syntax: scss,
  },
});

testRuleScss('always', function(tr) {
  tr.ok('// comment', 'SCSS comment');
  tr.notOk('a {} // comment', rejectionMessage, 'empty rule block and a SCSS comment');
})
