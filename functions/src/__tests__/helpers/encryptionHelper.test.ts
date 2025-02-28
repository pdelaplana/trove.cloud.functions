import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';

jest.mock('@src/config', () => ({
  useConfig: jest.fn(),
}));

import { decryptKey, encryptKey } from '@src/shared/helpers/encryptionHelpers';
import { useConfig } from '@src/config';

describe('encryptionHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should encrypt and decrypt the key', () => {
    // Arrange
    (useConfig as jest.Mock).mockReturnValue({
      ENCRYPTION_SECRET: 'test-secret-key',
    });

    const apiKey =
      'oettN9vV+esoXg5pwbu94gpYrJh5y41LxJvawY5pyn799+vBje0BdAOEdkyJiJuX';

    // Act
    const encrypted = encryptKey(apiKey);
    const decrypted = decryptKey(encrypted);

    // Assert
    expect(decrypted).toBe(apiKey);
  });

  it('should throw error when encryption secret is not set', () => {
    // Re-mock with undefined secret
    (useConfig as jest.Mock).mockReturnValue({
      ENCRYPTION_SECRET: undefined,
    });

    expect(() => {
      encryptKey('test-key');
    }).toThrow('Environment variable ENCRYPTION_SECRET is required');
  });
});
