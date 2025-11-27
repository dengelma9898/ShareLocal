// Domain Entity - Listing
// Pure domain logic, keine Infrastruktur-Abhängigkeiten

export type ListingCategory = 'TOOL' | 'PLANT' | 'SKILL' | 'PRODUCT' | 'TIME' | 'OTHER';
export type ListingType = 'OFFER' | 'REQUEST';

export interface ListingEntity {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  userId: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerDay?: number | null;
  currency?: string | null;
  available: boolean;
  images: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Listing {
  constructor(private data: ListingEntity) {}

  get id(): string {
    return this.data.id;
  }

  get title(): string {
    return this.data.title;
  }

  get category(): ListingCategory {
    return this.data.category;
  }

  get type(): ListingType {
    return this.data.type;
  }

  get userId(): string {
    return this.data.userId;
  }

  isAvailable(): boolean {
    return this.data.available && !this.isDeleted();
  }

  isDeleted(): boolean {
    return this.data.deletedAt !== null;
  }

  toJSON(): ListingEntity {
    return { ...this.data };
  }

  // Domain Logic Methods
  markAsUnavailable(): void {
    this.data.available = false;
    this.data.updatedAt = new Date();
  }

  markAsAvailable(): void {
    this.data.available = true;
    this.data.updatedAt = new Date();
  }

  updateDetails(updates: Partial<Pick<ListingEntity, 'title' | 'description' | 'location' | 'pricePerDay' | 'images' | 'tags'>>): void {
    this.data = {
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    };
  }

  markAsDeleted(): void {
    this.data.deletedAt = new Date();
    this.data.available = false;
  }
}

