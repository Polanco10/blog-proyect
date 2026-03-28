/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    // Put .ts before .js so Jest resolves migrated files correctly
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'commonjs',
                    strict: false,
                    esModuleInterop: true,
                    skipLibCheck: true,
                },
            },
        ],
    },
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.ts'],
    collectCoverageFrom: [
        'controllers/**/*.{js,ts}',
        'models/**/*.{js,ts}',
        'utils/**/*.{js,ts}',
        'routes/**/*.{js,ts}',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
};
