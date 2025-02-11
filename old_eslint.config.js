import pluginJs from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';

export default [
  {
    ignores: [
      'built/**/*',
      'coverage/**/*',
      'docs/api/**/*',
      'lib/**/*',
      'types/**/*',
    ],
  },
  {
    ...pluginJs.configs.recommended,
    name: 'Source',
    files: [
      'src/**/*',
    ],
    ignores: [
      'src/parser/grammars/grammar.js',
    ],
  },
  {
    ...pluginJest.configs['flat/recommended'],
    ...pluginJest.configs['flat/style'],
    name: 'Tests',
    files: [
      'tests/**/*',
      '**/*.test.js',
    ],
    ...{
      rules: {
        'no-console': 'off',
      },
    },
  },
];
