import { describe, it, expect } from '@jest/globals';
import { decryptKey, encryptKey } from '@src/shared/helpers/encryptionHelpers';

describe('encryptionHelper', () => {
  describe('encrypt', () => {
    it('should encrypt and decrypt the key', () => {
      // Arrange
      const apiKey =
        '7c9c53276ff5c76aff22e0a794be536f5cbe687d5edb980347a6c1e463f582f3';

      // Act
      const encrypted = encryptKey(apiKey);
      const decrypted = decryptKey(encrypted);

      // Assert
      expect(decrypted).toBe(apiKey);
    });
  });
});
