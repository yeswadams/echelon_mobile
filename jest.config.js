/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testTimeout: 30000,
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|expo-router|expo-linking|expo-secure-store|expo-web-browser|expo-constants|expo-status-bar|expo-font|expo-splash-screen|@sanity/.*|@supabase/.*|@shopify/flash-list|@gorhom/bottom-sheet|@ptomasroos/react-native-multi-slider|react-clone-referenced-element|@react-navigation/.*|@react-native-community/.*|react-native-.*|@expo-google-fonts/.*|native-base|nativewind|react-native-css-interop)/)',
  ],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/node_modules/**',
  ],
};
