// API Client für Listings
// Funktionen zum Abrufen und Verwalten von Listings

import apiClient from './client';
import { Listing, ListingCategory } from '@sharelocal/shared';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    page?: number;
  };
}

export interface ListingFilters {
  category?: ListingCategory[]; // Array von Kategorien (wird zu einzelnen Requests konvertiert)
  type?: 'OFFER' | 'REQUEST';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListingQueryParams {
  category?: string; // Einzelne Kategorie (API unterstützt nur eine)
  type?: 'OFFER' | 'REQUEST';
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Konvertiert ListingFilters zu Query Params
 * Note: API unterstützt nur eine Kategorie pro Request
 * Wenn mehrere Kategorien gewählt sind, wird die erste verwendet
 */
function filtersToQueryParams(filters: ListingFilters): ListingQueryParams {
  const params: ListingQueryParams = {};

  // API unterstützt nur eine Kategorie, nehmen wir die erste
  if (filters.category && filters.category.length > 0) {
    params.category = filters.category[0];
  }

  if (filters.type) {
    params.type = filters.type;
  }

  if (filters.search) {
    params.search = filters.search;
  }

  if (filters.limit) {
    params.limit = filters.limit;
  }

  if (filters.offset) {
    params.offset = filters.offset;
  }

  return params;
}

/**
 * Holt alle Listings mit optionalen Filtern
 */
export async function getListings(filters: ListingFilters = {}): Promise<PaginatedResponse<Listing>> {
  const params = filtersToQueryParams(filters);
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const response = await apiClient.get<{ data: Listing[]; pagination: any }>(
    `/listings${queryString ? `?${queryString}` : ''}`
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Holt ein einzelnes Listing nach ID (inkl. Owner Info)
 */
export async function getListing(id: string): Promise<Listing & { owner?: any }> {
  const response = await apiClient.get<{ data: Listing & { owner?: any } }>(`/listings/${id}`);
  return response.data.data;
}

/**
 * Erstellt ein neues Listing
 */
export async function createListing(data: {
  title: string;
  description: string;
  category: string;
  type: 'OFFER' | 'REQUEST';
  location?: string;
  pricePerDay?: number;
  currency?: string;
  tags?: string[];
}): Promise<Listing> {
  const response = await apiClient.post<{ data: Listing }>('/listings', data);
  return response.data.data;
}

/**
 * Aktualisiert ein Listing
 */
export async function updateListing(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    type: 'OFFER' | 'REQUEST';
    location?: string;
    pricePerDay?: number;
    currency?: string;
    available: boolean;
    tags?: string[];
  }>
): Promise<Listing> {
  const response = await apiClient.put<{ data: Listing }>(`/listings/${id}`, data);
  return response.data.data;
}

/**
 * Löscht ein Listing (soft delete)
 */
export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

/**
 * Holt alle Listings des aktuellen Users
 */
export async function getMyListings(filters: Omit<ListingFilters, 'category' | 'type'> = {}): Promise<PaginatedResponse<Listing>> {
  // Note: userId wird vom Backend aus dem Token extrahiert
  const params: ListingQueryParams = {};

  if (filters.search) {
    params.search = filters.search;
  }

  if (filters.limit) {
    params.limit = filters.limit;
  }

  if (filters.offset) {
    params.offset = filters.offset;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const response = await apiClient.get<{ data: Listing[]; pagination: any }>(
    `/listings/my${queryString ? `?${queryString}` : ''}`
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

