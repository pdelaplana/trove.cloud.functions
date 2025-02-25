import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { logger } from 'firebase-functions/v2';
import { useConfig } from '@src/config';

const ALGORITHM = 'aes-256-cbc';

// Function to generate a secure API key
export function generateKey(): string {
  try {
    return crypto.randomBytes(32).toString('hex');
  } catch (error) {
    logger.error('Error generating API key', error);
    return '';
  }
}

// Function to hash API key before storing
export async function hashKey(apiKey: string): Promise<string> {
  try {
    return await bcrypt.hash(apiKey, 12); // 12 salt rounds
  } catch (error) {
    logger.error('Error hashing API key', error);
    return '';
  }
}

export function bcryptCompare(
  apiKey: string,
  hashedApiKey: string
): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedApiKey);
}

// Function to encrypt API key
export function encryptKey(apiKey: string): string {
  const { ENCRYPTION_SECRET } = useConfig();
  try {
    // Generate a random IV
    const iv = crypto.randomBytes(16);

    // Create a key from the secret
    const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);

    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encryptedData = Buffer.concat([
      cipher.update(apiKey, 'utf8'),
      cipher.final(),
    ]);

    // Combine IV and encrypted data with a delimiter
    return `${iv.toString('hex')}:${encryptedData.toString('hex')}`;
  } catch (error) {
    logger.error('Error encrypting API key', error);
    throw error; // Better to throw than return empty string
  }
}

// Function to decrypt API key
export function decryptKey(encryptedKey: string): string {
  const { ENCRYPTION_SECRET } = useConfig();
  try {
    // Split IV and encrypted data
    const [ivHex, encryptedHex] = encryptedKey.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted key format');
    }

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Create key from secret
    const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Error decrypting API key', error);
    throw error; // Better to throw than return empty string
  }
}
