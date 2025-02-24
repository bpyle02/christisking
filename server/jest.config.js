/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    transform: {
        "^.+\\.js$": "babel-jest",
    },
    collectCoverage: true,
    coverageDirectory: "./coverage",
    testMatch: ['**/*.test.js'],
    moduleFileExtensions: ['js', 'mjs', 'json'],
    testTimeout: 3000
  };
  
  
  export default config;