// Validation Schemas für Listing mit Zod

import { z } from 'zod';

const listingCategorySchema = z.enum(['TOOL', 'PLANT', 'SKILL', 'PRODUCT', 'TIME', 'OTHER']);
const listingTypeSchema = z.enum(['OFFER', 'REQUEST']);

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  category: listingCategorySchema,
  type: listingTypeSchema,
  userId: z.string().uuid('Invalid user ID').optional(), // Wird aus Token übernommen wenn nicht angegeben
  location: z.string().max(200, 'Location too long').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  pricePerDay: z.number().positive('Price must be positive').optional().nullable(),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., EUR)').optional().default('EUR'),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').optional().default([]),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Maximum 20 tags allowed').optional().default([]),
});

export const updateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long').optional(),
  location: z.string().max(200, 'Location too long').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  pricePerDay: z.number().positive('Price must be positive').optional().nullable(),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Maximum 20 tags allowed').optional(),
  available: z.boolean().optional(),
});

export const getListingParamsSchema = z.object({
  id: z.string().uuid('Invalid listing ID'),
});

export const getListingsQuerySchema = z.object({
  category: listingCategorySchema.optional(),
  type: listingTypeSchema.optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  available: z.string().optional(),
  search: z.string().min(1).optional(),
  tags: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type GetListingParams = z.infer<typeof getListingParamsSchema>;
export type GetListingsQuery = z.infer<typeof getListingsQuerySchema>;

