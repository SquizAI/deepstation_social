import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * Must be a 32-character string for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters for AES-256');
  }

  return Buffer.from(key, 'utf-8');
}

/**
 * Encrypt text using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:salt:encryptedData (hex encoded)
 */
export function encrypt(text: string): string {
  try {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:salt:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${salt.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text encrypted with encrypt()
 * @param encryptedText - Encrypted text in format: iv:authTag:salt:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) {
      throw new Error('Encrypted text cannot be empty');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, saltHex, encryptedData] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * This is a utility function for generating the ENCRYPTION_KEY
 * @returns 32-character random string suitable for AES-256
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString('hex');
}
