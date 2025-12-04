// HTTP Adapter: Image Upload Routes
// Express-spezifische Implementierung für Image Uploads

import { Router } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthService } from '../../../ports/services/AuthService.js';
import { StorageService } from '../../../ports/services/StorageService.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AppError } from '../middleware/errorHandler.js';

// Configure multer for memory storage (we'll upload to server-based storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

export function createImageRoutes(
  storageService: StorageService,
  authService: AuthService,
  userRepository: UserRepository
): Router {
  const router = Router();

  // POST /api/images/upload - Upload a single image (Protected)
  router.post(
    '/upload',
    authenticate(authService, userRepository),
    upload.single('image'),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        if (!req.file) {
          throw new AppError(400, 'No image file provided');
        }

        const { buffer, originalname, mimetype } = req.file;

        // Upload to storage
        const imageUrl = await storageService.uploadImage(buffer, originalname, mimetype);

        return res.json({
          data: {
            url: imageUrl,
            filename: originalname,
            mimetype,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

