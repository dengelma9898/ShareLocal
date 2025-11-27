// Validation Middleware für Express mit Zod

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidatedRequest<T = unknown> extends Request {
  validated?: T;
  validatedParams?: unknown; // Separate storage for params to avoid overwriting
  validatedBody?: unknown;  // Separate storage for body
  validatedQuery?: unknown; // Separate storage for query
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const bodyData = schema.parse(req.body);
      req.validatedBody = bodyData as unknown;
      // Preserve params if they exist
      const params = (req.validatedParams as Record<string, unknown>) || {};
      const body = bodyData as Record<string, unknown>;
      req.validated = { ...params, ...body } as T;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const paramsData = schema.parse(req.params);
      req.validatedParams = paramsData;
      req.validated = paramsData as T;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const queryData = schema.parse(req.query);
      req.validatedQuery = queryData as unknown;
      // Preserve params and body if they exist
      req.validated = { ...(req.validatedParams as Record<string, unknown> || {}), ...(req.validatedBody as Record<string, unknown> || {}), ...(queryData as Record<string, unknown>) } as T;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

