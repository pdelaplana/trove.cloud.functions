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
  try {
    const { ENCRYPTION_SECRET } = useConfig();
    logger.info(ENCRYPTION_SECRET);
    if (!ENCRYPTION_SECRET) {
      throw new Error('Environment variable ENCRYPTION_SECRET is required');
    }

    // Create a key from the secret and a random salt
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_SECRET, salt, 32);

    // Generate a random IV
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encryptedData = Buffer.concat([
      cipher.update(apiKey, 'utf8'),
      cipher.final(),
    ]);

    // Combine salt, IV and encrypted data with delimiters
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encryptedData.toString('hex')}`;
  } catch (error) {
    logger.error('Error encrypting API key', error);
    throw error;
  }
}

// Function to decrypt API key
export function decryptKey(encryptedKey: string): string {
  try {
    const { ENCRYPTION_SECRET } = useConfig();
    if (!ENCRYPTION_SECRET) {
      throw new Error('Environment variable ENCRYPTION_SECRET is required');
    }

    // Split salt, IV and encrypted data
    const [saltHex, ivHex, encryptedHex] = encryptedKey.split(':');
    if (!saltHex || !ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted key format');
    }

    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Create key using the same salt
    const key = crypto.scryptSync(ENCRYPTION_SECRET, salt, 32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Error decrypting API key', error);
    throw error;
  }
}
