module.exports = {
  'env': {
      'browser': true,
      'es6': true
  },
  'extends': 'eslint:recommended',
  'globals': {
      'Atomics': 'readonly',
      'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
      'ecmaVersion': 2018,
      'sourceType': 'module'
  },
  'rules': {
      'quotes': [
          2,
          'single'
      ],
      'semi': [
          2,
          'always'
      ],
      'space-before-blocks': 2,
      'no-console': 2,
      'eqeqeq': 2,
      'no-multi-spaces': 2,
      'space-in-parens': 2,
      'array-bracket-spacing': 2,
      'brace-style': [
          '1tbs',
          { 'allowSingleLine': true }
      ],
      'comma-dangle': [2, 'never'],
      'comma-spacing': [2, { 'before': false, 'after': true }],
      'indent': [2, 2],
      'max-len': [2, 180, 2],
      'no-multiple-empty-lines': [2, { 'max': 1, 'maxEOF': 0, 'maxBOF': 0 }],
      'one-var-declaration-per-line': 2,
      'object-curly-spacing': [2, 'always'],
      'prefer-const': 1
  }
};