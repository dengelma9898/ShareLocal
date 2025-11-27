// Use Case: Update Listing
// Application Layer - Orchestriert Domain Logic und Ports

import { ListingRepository, UpdateListingData } from '../../ports/repositories/ListingRepository.js';
import { Listing } from '../../domain/entities/Listing.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export class UpdateListingUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(listingId: string, data: UpdateListingData): Promise<Listing> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new AppError(404, 'Listing not found');
    }

    return this.listingRepository.update(listingId, data);
  }
}

