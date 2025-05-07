import * as cssPlugin from 'eslint-plugin-css';
import globals from 'globals';
import html from '@html-eslint/eslint-plugin';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import mochaPlugin from 'eslint-plugin-mocha';
import sonarjs from 'eslint-plugin-sonarjs';
import stylistic from '@stylistic/eslint-plugin';

export default [
  cssPlugin.configs['flat/recommended'],
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  sonarjs.configs.recommended,

  // All JS files
  {
    files: [ '**/*.{js,mjs}' ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions,
      },
    },
    plugins: {
      'pluginSonarjs': sonarjs,
      '@stylistic': stylistic,
    },
    rules: {
      'camelcase': 'warn',
      'capitalized-comments': [ 'warn', 'always', { ignoreConsecutiveComments: true } ],
      // 'complexity': 'warn', // why not use sonarjs for this?
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': 'warn',
      // 'eqeqeq': 'error',
      // 'line-comment-position': 'warn',
      'logical-assignment-operators': 'warn',
      // 'max-depth': ['warn', 4],
      'new-cap': 'warn',
      'no-alert': 'warn',
      'no-array-constructor': 'warn',
      'no-caller': 'error',
      'no-console': [ 'error', { allow: [ 'info', 'warn', 'error' ] } ],
      'no-duplicate-imports': 'error',
      'no-else-return': 'warn',
      'no-empty-function': 'error',
      'no-empty-static-block': 'error',
      // 'no-eq-null': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-extra-label': 'error',
      // 'no-implicit-coercion': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'warn',
      'no-loop-func': 'error',
      // 'no-magic-numbers': 'warn',
      'no-multi-assign': 'error',
      'no-multi-str': 'warn',
      // 'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-new-wrappers': 'error',
      'no-promise-executor-return': 'error',
      'no-proto': 'warn',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-shadow': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-underscore-dangle': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-unreachable-loop': 'warn',
      // 'no-unused-expressions': 'warn', // tooltip.clientHeight; // Forces the browser to "reflow" -- not aware of alternatives to do this
      'no-unused-private-class-members': 'warn',
      // 'no-use-before-define': 'warn',
      'no-useless-call': 'warn',
      'no-useless-computed-key': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-constructor': 'warn',
      'no-useless-rename': 'warn',
      'no-useless-return': 'warn',
      'no-var': 'error',
      // 'no-warning-comments': 'warn',
      'object-shorthand': 'warn',
      'operator-assignment': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-const': 'warn',
      // 'prefer-destructuring': 'warn',
      'prefer-object-has-own': 'warn',
      'prefer-object-spread': 'warn',
      'prefer-promise-reject-errors': 'warn',
      'prefer-spread': 'warn',
      // 'prefer-template': 'warn',
      // 'require-atomic-updates': 'error',
      'require-await': 'error',
      'sort-imports': 'warn',
      'sort-vars': 'warn',
      'yoda': 'warn',

      // TODO Update/enable these rules. Only temporarily disabled.
      'jsdoc/no-defaults': 0,
      'sonarjs/cognitive-complexity': 0,
      'sonarjs/sonar-max-params': 0,
      'sonarjs/todo-tag': 0,
      // Broken rules
      'sonarjs/sonar-no-fallthrough': 0, // Broken in eslint-plugin-sonarjs v2.0.2

      // Stylistic rules
      ...stylistic.configs['recommended-flat'].rules,
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/quotes': [ 'error', 'single' ],
      '@stylistic/semi': [ 'error', 'always' ],
      '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
      '@stylistic/brace-style': [ 'warn', '1tbs', { allowSingleLine: true } ],
      '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
      '@stylistic/keyword-spacing': [ 'warn', { before: true, after: true } ],
      '@stylistic/space-before-function-paren': [ 'error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      } ],
    },
  },
  {
    // Exclude Node globals from /src/ JS linting
    files: [ '**/src/**/*.{js,mjs}}' ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
  },

  // HTML files
  {
    ...html.configs['flat/recommended'],
    files: [ '**/*.html' ],
    rules: {
      ...html.configs['flat/recommended'].rules,
      '@html-eslint/attrs-newline': 'off', // TODO enable and fix issues (['error', { ifAttrsMoreThan: 4 }])
      '@html-eslint/lowercase': 'error',
      '@html-eslint/no-multiple-empty-lines': 'error',
      '@html-eslint/no-trailing-spaces': 'warn',
      // '@html-eslint/id-naming-convention': [ 'error', 'kebab-case' ], // TODO enable and fix issues
      '@html-eslint/use-baseline': 'off', // Flagged false-positives (such as select.size)
    },
  },

  // Tests
  {
    // Mocha tests
    ...mochaPlugin.configs.recommended,
    files: [ 'test/specs/**/*.{js,mjs}' ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.node,
      },
    },
    rules: {
      'prefer-arrow-callback': 0, // Disabled as Mocha requires the "function" keyword for `this` access.
    },
  },
  {
    // Playwright uses destructing in tests/fixtures and sometimes requires
    // empty patterns ("{}"). The 'no-empty-pattern' rule is disabled for
    // these files.
    files: [ 'test/e2e/**/fixtures/*.js' ],
    rules: {
      'no-empty-pattern': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      '.nyc_output/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'docs/test-results/**',
    ],
  },
];
