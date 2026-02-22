module.exports = {
    preset: 'jest-expo',
    setupFiles: ['./jest.setup.js'],
    testPathIgnorePatterns: ['/node_modules/', '__tests__/helpers/'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{ts,tsx}',
        '!**/coverage/**',
        '!**/node_modules/**',
        '!**/babel.config.js',
        '!**/jest.setup.js',
    ],
    coverageThreshold: {
        './lib/services/': {
            statements: 75,
            branches: 50,
            functions: 100,
            lines: 100,
        },
    },
};
