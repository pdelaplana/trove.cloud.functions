module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.dev.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/generated/**/*', // Ignore generated files.
    '/coverage', // Ignore coverage directory.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'no-unused-vars': [
      'error',
      {
        args: 'none',
      },
    ],
  },
};
