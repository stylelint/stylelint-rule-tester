# stylelint-rule-tester

An easy way to test [stylelint](https://github.com/stylelint/stylelint) rules.

For documentation, read the comments (or if you would like to help write docs, please PR!).

For examples, check out the rule tests in [stylelint](https://github.com/stylelint/stylelint).

Here's a quick example, though. Given the following test:

```js
var ruleTester = require('stylelint-rule-tester');
var noEmptyBlocksRule = require('path/to/noEmptyBlocksRule');

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
```

The following TAP output will be logged:

```
TAP version 13
#
css: ""
rule: my-no-empty-blocks-rule
options: "always"
ok 1 empty should pass
#
css: "@import 'foo.css';"
rule: my-no-empty-blocks-rule
options: "always"
ok 2 blockless at-rule should pass
#
css: "a { color: pink; }"
rule: my-no-empty-blocks-rule
options: "always"
ok 3 rule with a declaration should pass
#
css: "@media print { a { color: pink; } }"
rule: my-no-empty-blocks-rule
options: "always"
ok 4 at-rule with a rule with a declaration should pass
#
css: "a {}"
rule: my-no-empty-blocks-rule
options: "always"
ok 5 empty rule block should warn
ok 6 empty rule block warning message should be "Please, no empty blocks!"
#
css: "a { }"
rule: my-no-empty-blocks-rule
options: "always"
ok 7 rule block with a single space should warn
ok 8 rule block with a single space warning message should be "Please, no empty blocks!"
#
css: "a {\n}"
rule: my-no-empty-blocks-rule
options: "always"
ok 9 rule block with a newline should warn
ok 10 rule block with a newline warning message should be "Please, no empty blocks!"
#
css: "@media print {}"
rule: my-no-empty-blocks-rule
options: "always"
ok 11 empty at-rule block should warn
ok 12 empty at-rule block warning message should be "Please, no empty blocks!"
#
css: "@media print { a {} }"
rule: my-no-empty-blocks-rule
options: "always"
ok 13 at-rule block with an empty rule block should warn
ok 14 at-rule block with an empty rule block warning message should be "Please, no empty blocks!"
ok 15 at-rule block with an empty rule block warning should be at line 6
ok 16 at-rule block with an empty rule block warning should be at column 3

1..16
# tests 16
# pass  16

# ok
```
