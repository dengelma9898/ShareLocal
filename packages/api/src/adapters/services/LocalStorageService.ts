// Adapter: Local File Storage Service
// Speichert Bilder lokal im Dateisystem auf dem Server
// 
// ⚠️ WICHTIG: Für MVP verwendet (Server-basierte Speicherung auf IONOS)
// Später kann zu IONOS Object Storage migriert werden wenn nötig

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { StorageService } from '../../ports/services/StorageService.js';
import { logger } from '../../utils/logger.js';

export class LocalStorageService implements StorageService {
  private uploadDir: string;
  private publicUrl: string;

  constructor() {
    // Upload-Verzeichnis: uploads/images im API-Package
    // Für deployed Environments sollte ein absoluter Pfad verwendet werden
    this.uploadDir = process.env.LOCAL_STORAGE_DIR || join(process.cwd(), 'uploads', 'images');
    
    // Public URL: Automatisch basierend auf Environment
    // Für deployed Environments sollte die vollständige Domain verwendet werden
    // Die API serviert Bilder selbst über Express.static, daher über NGINX-Route
    if (process.env.LOCAL_STORAGE_PUBLIC_URL) {
      this.publicUrl = process.env.LOCAL_STORAGE_PUBLIC_URL;
    } else if (process.env.NODE_ENV === 'production' && process.env.BASE_URL) {
      // Production: Verwende BASE_URL falls gesetzt
      // NGINX leitet /share-local/prd/uploads/images/ an die API weiter
      this.publicUrl = `${process.env.BASE_URL}/share-local/prd/uploads/images`;
    } else if (process.env.BASE_URL) {
      // Development Deployment: Verwende BASE_URL mit dev-Prefix
      // NGINX leitet /share-local/dev/uploads/images/ an die API weiter
      this.publicUrl = `${process.env.BASE_URL}/share-local/dev/uploads/images`;
    } else {
      // Local Development: Localhost
      const port = process.env.PORT || 3001;
      this.publicUrl = `http://localhost:${port}/uploads/images`;
    }

    // Erstelle Upload-Verzeichnis falls es nicht existiert
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      if (!existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
        logger.info('Created local upload directory', { path: this.uploadDir });
      }
    } catch (error) {
      logger.error('Failed to create upload directory', { error, path: this.uploadDir });
      throw error;
    }
  }

  async uploadImage(file: Buffer, filename: string, mimetype: string): Promise<string> {
    try {
      // Validate MIME type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimetype)) {
        throw new Error(`Invalid MIME type: ${mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.length > maxSize) {
        throw new Error(`File too large: ${file.length} bytes. Maximum size: ${maxSize} bytes`);
      }

      // Generate unique filename: timestamp-random-originalname
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const extension = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `${timestamp}-${random}.${extension}`;
      const filePath = join(this.uploadDir, uniqueFilename);

      // Write file to disk
      await writeFile(filePath, file);

      // Return public URL
      const imageUrl = `${this.publicUrl}/${uniqueFilename}`;
      logger.info('Image uploaded successfully (local storage)', { filename: uniqueFilename, url: imageUrl });
      return imageUrl;
    } catch (error) {
      logger.error('Failed to upload image (local storage)', { error, filename });
      throw error;
    }
  }

  async deleteImage(url: string): Promise<void> {
    try {
      // Extract filename from URL
      // URL format: http://localhost:3001/uploads/images/timestamp-random.jpg
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop();
      
      if (!filename) {
        throw new Error('Invalid image URL: no filename found');
      }

      const filePath = join(this.uploadDir, filename);

      if (existsSync(filePath)) {
        await unlink(filePath);
        logger.info('Image deleted successfully (local storage)', { url, filename });
      } else {
        logger.warn('Image file not found for deletion', { url, filename, path: filePath });
      }
    } catch (error) {
      logger.error('Failed to delete image (local storage)', { error, url });
      throw error;
    }
  }
}

