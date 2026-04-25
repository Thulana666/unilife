/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": ["babel-jest", { configFile: "./babel-jest.config.js" }],
  },
  // Map @/ path alias used throughout the Next.js app
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Collect test files only from the tests/ directory
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  // Clear mocks between each test automatically
  clearMocks: true,
  // Show verbose per-test output
  verbose: true,
};

module.exports = config;
