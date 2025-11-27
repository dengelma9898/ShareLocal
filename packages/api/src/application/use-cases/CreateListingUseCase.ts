// Use Case: Create Listing
// Application Layer - Orchestriert Domain Logic und Ports

import { ListingRepository, CreateListingData } from '../../ports/repositories/ListingRepository.js';
import { UserRepository } from '../../ports/repositories/UserRepository.js';
import { Listing } from '../../domain/entities/Listing.js';

export class CreateListingUseCase {
  constructor(
    private listingRepository: ListingRepository,
    private userRepository: UserRepository
  ) {}

  async execute(data: CreateListingData): Promise<Listing> {
    // Validierung: User muss existieren
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Domain Logic: Listing erstellen
    const listing = await this.listingRepository.create(data);

    return listing;
  }
}

