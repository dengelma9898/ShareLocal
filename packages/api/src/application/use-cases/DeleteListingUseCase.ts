// Use Case: Delete Listing (Soft Delete)
// Application Layer - Orchestriert Domain Logic und Ports

import { ListingRepository } from '../../ports/repositories/ListingRepository.js';
import { AppError } from '../../adapters/http/middleware/errorHandler.js';

export class DeleteListingUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(listingId: string): Promise<void> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new AppError(404, 'Listing not found');
    }

    await this.listingRepository.delete(listingId);
  }
}

