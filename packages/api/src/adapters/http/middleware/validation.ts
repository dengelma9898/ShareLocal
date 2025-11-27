// Validation Middleware für Express mit Zod

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidatedRequest<T> extends Request {
  validated?: T;
  validatedParams?: Record<string, unknown>; // Separate storage for params to avoid overwriting
  validatedBody?: Record<string, unknown>;  // Separate storage for body
  validatedQuery?: Record<string, unknown>; // Separate storage for query
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const bodyData = schema.parse(req.body);
      req.validatedBody = bodyData;
      // Preserve params if they exist
      req.validated = { ...req.validatedParams, ...bodyData } as T;
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
      req.validatedQuery = queryData;
      // Preserve params and body if they exist
      req.validated = { ...req.validatedParams, ...req.validatedBody, ...queryData } as T;
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

