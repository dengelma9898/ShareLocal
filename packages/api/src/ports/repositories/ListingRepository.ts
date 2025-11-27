// Port: Listing Repository Interface
// Definiert die Schnittstelle für Listing-Datenzugriff

import { Listing } from '../../domain/entities/Listing.js';

export interface CreateListingData {
  title: string;
  description: string;
  category: Listing['category'];
  type: Listing['type'];
  userId: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerDay?: number | null;
  currency?: string | null;
  images?: string[];
  tags?: string[];
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  location?: string | null;
  pricePerDay?: number | null;
  images?: string[];
  tags?: string[];
  available?: boolean;
}

export interface ListingFilters {
  category?: Listing['category'];
  type?: Listing['type'];
  userId?: string;
  available?: boolean;
  search?: string; // Suche in title/description
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radiusKm?: number; // Radius in Kilometern
  };
}

export interface ListingRepository {
  // CRUD Operations
  findById(id: string): Promise<Listing | null>;
  create(data: CreateListingData): Promise<Listing>;
  update(id: string, data: UpdateListingData): Promise<Listing>;
  delete(id: string): Promise<void>;

  // Query Operations
  findAll(filters?: ListingFilters, limit?: number, offset?: number): Promise<Listing[]>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Listing[]>;
  count(filters?: ListingFilters): Promise<number>;
}

