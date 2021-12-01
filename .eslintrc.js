module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'alloy',
        'alloy/typescript',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        indent: ['error', 4],
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/typedef': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        'comma-dangle': ['error', 'always-multiline'],
        'eol-last': 2,
        semi: ['error', 'always'],
        quotes: [2, 'single'],
        'complexity': 'off',
        'max-nested-callbacks': 'off',
    },
};
