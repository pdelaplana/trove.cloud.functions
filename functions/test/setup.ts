import { expect, jest, beforeAll, afterAll } from '@jest/globals';

// Extend timeout for all tests
jest.setTimeout(10000);

// Add custom matchers if needed
expect.extend({
  // Add your custom matchers here
});

// Setup global test environment
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'your-project-id',
  databaseURL: 'https://your-project-id.firebaseio.com',
});

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});
