// Standalone Jest configuration (replaces the react-scripts `test` runner).
// Mirrors the essentials Create React App used to inject: a jsdom
// environment, babel-jest transform (driven by .babelrc), CSS/asset module
// stubs and reset-mocks-per-test.
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest/polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/jest/fileMock.js'
  },
  resetMocks: true,
  coverageReporters: ['html', 'cobertura'],
  collectCoverageFrom: ['src/services/**/*.js'],
  coveragePathIgnorePatterns: [
    'src/services/experiments/execution/running-simulation-service.js',
    'src/services/roslib-service.js',
    'src/services/experiments/files/import-experiment-service.js',
    'src/services/experiments/files/remote-experiment-files-service.js',
    'src/services/nrp-analytics-service.js'
  ]
};
