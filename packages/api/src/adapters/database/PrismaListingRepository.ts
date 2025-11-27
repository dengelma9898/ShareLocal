// Adapter: Prisma Implementation für ListingRepository
// Konkrete Implementierung des ListingRepository Ports

import { PrismaClient, Prisma } from '@prisma/client';
import {
  ListingRepository,
  CreateListingData,
  UpdateListingData,
  ListingFilters,
} from '../../ports/repositories/ListingRepository.js';
import { Listing } from '../../domain/entities/Listing.js';

export class PrismaListingRepository implements ListingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Listing | null> {
    const listingData = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
    });

    if (!listingData) return null;

    return new Listing(listingData);
  }

  async create(data: CreateListingData): Promise<Listing> {
    const listingData = await this.prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        userId: data.userId,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        pricePerDay: data.pricePerDay,
        currency: data.currency ?? 'EUR',
        images: data.images ?? [],
        tags: data.tags ?? [],
        available: true,
      },
    });

    return new Listing(listingData);
  }

  async update(id: string, data: UpdateListingData): Promise<Listing> {
    const listingData = await this.prisma.listing.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return new Listing(listingData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.listing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        available: false,
      },
    });
  }

  async findAll(filters?: ListingFilters, limit = 50, offset = 0): Promise<Listing[]> {
    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.available !== undefined) {
      where.available = filters.available;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Geografische Suche (später mit PostGIS optimieren)
    if (filters?.location) {
      // Einfache Implementierung - später mit PostGIS erweitern
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const listings = await this.prisma.listing.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((listingData) => new Listing(listingData));
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Listing[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((listingData) => new Listing(listingData));
  }

  async count(filters?: ListingFilters): Promise<number> {
    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.available !== undefined) {
      where.available = filters.available;
    }

    return this.prisma.listing.count({ where });
  }
}

