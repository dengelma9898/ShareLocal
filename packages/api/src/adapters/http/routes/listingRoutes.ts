// HTTP Adapter: Listing Routes
// Express-spezifische Implementierung

import { Router } from 'express';
import { CreateListingUseCase } from '../../../application/use-cases/CreateListingUseCase.js';
import { UpdateListingUseCase } from '../../../application/use-cases/UpdateListingUseCase.js';
import { DeleteListingUseCase } from '../../../application/use-cases/DeleteListingUseCase.js';
import { ListingRepository, ListingFilters } from '../../../ports/repositories/ListingRepository.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  ValidatedRequest,
} from '../middleware/validation.js';
import {
  createListingSchema,
  updateListingSchema,
  getListingParamsSchema,
  getListingsQuerySchema,
  CreateListingInput,
  UpdateListingInput,
  GetListingParams,
  GetListingsQuery,
} from '../../../domain/validation/listingSchemas.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthService } from '../../../ports/services/AuthService.js';
import { UserRepository } from '../../../ports/repositories/UserRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export function createListingRoutes(
  createListingUseCase: CreateListingUseCase,
  updateListingUseCase: UpdateListingUseCase,
  deleteListingUseCase: DeleteListingUseCase,
  listingRepository: ListingRepository,
  authService: AuthService,
  userRepository: UserRepository
): Router {
  const router = Router();

  // GET /api/listings - List all listings with filters
  router.get(
    '/',
    validateQuery(getListingsQuerySchema),
    async (req: ValidatedRequest<GetListingsQuery>, res, next) => {
      try {
        const query = req.validated!;
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const filters: ListingFilters = {
          category: query.category,
          type: query.type,
          userId: query.userId,
          search: query.search,
          tags: query.tags ? query.tags.split(',') : undefined,
        };
        if (query.available !== undefined) {
          filters.available = query.available === 'true';
        }

        const listings = await listingRepository.findAll(filters, limit, offset);
        const total = await listingRepository.count(filters);

        return res.json({
          data: listings.map((listing) => listing.toJSON()),
          pagination: {
            limit,
            offset,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/listings/my - Get current user's listings (Protected)
  router.get(
    '/my',
    authenticate(authService, userRepository),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
        const filters: ListingFilters = {
          userId: req.user!.userId,
          search: req.query.search as string | undefined,
        };

        const listings = await listingRepository.findAll(filters, limit, offset);
        const total = await listingRepository.count(filters);

        return res.json({
          data: listings.map((listing) => listing.toJSON()),
          pagination: {
            limit,
            offset,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/listings/:id - Get listing by ID
  router.get(
    '/:id',
    validateParams(getListingParamsSchema),
    async (req: ValidatedRequest<{ id: string }>, res, next) => {
      try {
        const { id } = req.validated!;
        const listing = await listingRepository.findById(id);

        if (!listing) {
          return res.status(404).json({ error: 'Listing not found' });
        }

        // Fetch owner information
        const owner = await userRepository.findById(listing.userId);

        return res.json({
          data: {
            ...listing.toJSON(),
            owner: owner ? owner.toJSON() : null,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/listings - Create listing (Protected: nur für eingeloggte User)
  router.post(
    '/',
    authenticate(authService, userRepository),
    validateBody(createListingSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<CreateListingInput>, res, next) => {
      try {
        // Set userId from authenticated user
        const validatedData = req.validated!;
        const listingData = {
          ...validatedData,
          userId: req.user!.userId,
        };
        const listing = await createListingUseCase.execute(listingData);
        return res.status(201).json({ data: listing.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // PUT /api/listings/:id - Update listing (Protected: nur Owner)
  router.put(
    '/:id',
    authenticate(authService, userRepository),
    validateParams(getListingParamsSchema),
    validateBody(updateListingSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<GetListingParams & UpdateListingInput>, res, next) => {
      try {
        const validatedData = req.validated!;
        const { id } = validatedData;
        const listing = await listingRepository.findById(id);
        
        if (!listing) {
          throw new AppError(404, 'Listing not found');
        }
        
        // Check if user is the owner
        if (listing.userId !== req.user?.userId) {
          throw new AppError(403, 'You can only update your own listings');
        }
        
        // Extract update data (exclude id from update)
        const updateData: UpdateListingInput = { ...validatedData };
        delete (updateData as { id?: string }).id;
        const updatedListing = await updateListingUseCase.execute(id, updateData);
        return res.json({ data: updatedListing.toJSON() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // DELETE /api/listings/:id - Delete listing (Protected: nur Owner)
  router.delete(
    '/:id',
    authenticate(authService, userRepository),
    validateParams(getListingParamsSchema),
    async (req: AuthenticatedRequest & ValidatedRequest<{ id: string }>, res, next) => {
      try {
        const { id } = req.validated!;
        const listing = await listingRepository.findById(id);
        
        if (!listing) {
          throw new AppError(404, 'Listing not found');
        }
        
        // Check if user is the owner
        if (listing.userId !== req.user?.userId) {
          throw new AppError(403, 'You can only delete your own listings');
        }
        
        await deleteListingUseCase.execute(id);
        return res.status(204).send();
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
