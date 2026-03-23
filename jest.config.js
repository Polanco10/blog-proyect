/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    // Put .ts before .js so Jest resolves migrated files correctly
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                strict: false,
                esModuleInterop: true,
                skipLibCheck: true,
            },
        }],
    },
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.test.ts',
    ],
};
