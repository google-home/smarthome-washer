const globals = require('globals');
const googleConfig = require('eslint-config-google');

const rules = {...googleConfig.rules};
delete rules['valid-jsdoc'];
delete rules['require-jsdoc'];

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...rules,
      'no-unused-vars': 'warn',
    },
  },
];
