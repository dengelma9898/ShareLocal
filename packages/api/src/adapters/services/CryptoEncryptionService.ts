// Adapter: Crypto Encryption Service Implementation
// Konkrete Implementierung des EncryptionService Ports mit Node.js crypto

import crypto from 'crypto';
import { EncryptionService } from '../../ports/services/EncryptionService.js';

export class CryptoEncryptionService implements EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (process.env.NODE_ENV === 'production' && encryptionKey === 'change-me-in-production') {
      throw new Error('ENCRYPTION_KEY must be changed in production');
    }

    // Der Key sollte 32 Bytes lang sein (256 bits für AES-256)
    // Wir hashen immer zu 32 Bytes für Konsistenz und Sicherheit
    // Dies stellt sicher, dass der Key immer die richtige Länge hat
    this.key = crypto.createHash('sha256').update(encryptionKey).digest();
  }

  encrypt(plaintext: string): string {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get auth tag (for GCM mode)
      const authTag = cipher.getAuthTag();

      // Combine IV, authTag, and encrypted data
      // Format: iv:authTag:encryptedData (all base64)
      const ivBase64 = iv.toString('base64');
      const authTagBase64 = authTag.toString('base64');

      return `${ivBase64}:${authTagBase64}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  decrypt(ciphertext: string): string {
    try {
      // Split the ciphertext into parts
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const [ivBase64, authTagBase64, encrypted] = parts;

      // Convert from base64
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

