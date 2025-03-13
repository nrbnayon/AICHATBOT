// src/helpers/encryptionHelper.ts
import crypto from 'crypto';
import config from '../config';

// For AES-256, we need exactly 32 bytes (256 bits)
// Using scryptSync to derive a proper length key from the configuration
const ENCRYPTION_KEY = crypto.scryptSync(
  config.encryption.key as string,
  'salt',
  32
);
const IV_LENGTH = 16; // For AES, this is always 16

export const encryptionHelper = {
  /**
   * Encrypts a string using AES-256-CBC
   * @param text - The plaintext to encrypt
   * @returns The encrypted text with IV prefixed (format: iv:encryptedData)
   */
  encrypt(text: string): string {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with the derived key and IV
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Return IV and encrypted data as hex strings separated by a colon
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },

  /**
   * Decrypts a string that was encrypted with the encrypt method
   * @param text - The encrypted text (format: iv:encryptedData)
   * @returns The decrypted plaintext
   */
  decrypt(text: string): string {
    // Split the text into IV and encrypted data parts
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    // Create decipher with the same key and extracted IV
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Return the plaintext
    return decrypted.toString('utf8');
  },
};
