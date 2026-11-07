module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|@unimodules/.*|sentry-expo))'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
};
