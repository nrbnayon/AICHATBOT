import crypto from 'crypto';
import config from '../config';

// For AES-256, we need exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = crypto.scryptSync(
  config.encryption.key as string,
  config.encryption.salt || 'salt', // Use configured salt or default
  32
);
const IV_LENGTH = 16; // For AES, this is always 16

export const encryptionHelper = {
  encrypt(text: string): string {
    if (!text) return '';

    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

      let encrypted = cipher.update(text, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  decrypt(text: string): string {
    if (!text || !text.includes(':')) return '';

    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        ENCRYPTION_KEY,
        iv
      );

      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  },
};
