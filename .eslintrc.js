'use strict';

module.exports = {
  env: {
    node: true,
    mocha: true,
  },
  extends: ['google', 'prettier'],
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'script',
    ecmaFeatures: {
      modules: false,
    },
  },
  rules: {
    strict: ['error', 'global'],
    commaDangle: 'off',
    'arrow-parens': ['error', 'as-needed'],
    'max-len': [
      'error',
      {
        code: 120,
      },
    ],
    indent: ['error', 2],
    'require-jsdoc': 'off',
    camelcase: 'off',
    'linebreak-style': 'off',
    quotes: ['error', 'single']
  },
};
