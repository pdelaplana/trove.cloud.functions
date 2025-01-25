import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { logger } from 'firebase-functions/v2';

/*
const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET ||
  'BMc5NkapQqE2PNpyvkEwNELZJhPBLTWBodEcb3EW1WUGyrhdsmAB07xZmNEgEduk';
*/
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '';

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

// Function to encrypt API key
export function encryptKey(apiKey: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error('Error encrypting API key', error);
    return '';
  }
}

// Function to decrypt API key
export function decryptKey(encryptedKey: string): string {
  try {
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_SECRET),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting API key', error);
    return '';
  }
}

export function bcryptCompare(
  apiKey: string,
  hashedApiKey: string
): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedApiKey);
}
