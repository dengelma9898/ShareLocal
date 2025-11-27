// Health Check Middleware
// Prüft den Status der API und ihrer Dependencies

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../ports/services/EncryptionService.js';
import { logger } from '../../../utils/logger.js';

export interface HealthCheckDependencies {
  prisma: PrismaClient;
  encryptionService: EncryptionService;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  checks: {
    api: 'ok' | 'error';
    database: 'ok' | 'error';
    encryption: 'ok' | 'error';
  };
  timestamp: string;
  uptime: number;
  version: string;
}

/**
 * Prüft die Database-Connectivity
 */
async function checkDatabase(prisma: PrismaClient): Promise<'ok' | 'error'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch (error) {
    logger.error('Database health check failed', { error });
    return 'error';
  }
}

/**
 * Prüft den Encryption Service
 */
function checkEncryption(encryptionService: EncryptionService): 'ok' | 'error' {
  try {
    // Teste Verschlüsselung und Entschlüsselung
    const testMessage = 'health-check-test';
    const encrypted = encryptionService.encrypt(testMessage);
    const decrypted = encryptionService.decrypt(encrypted);
    
    if (decrypted === testMessage) {
      return 'ok';
    }
    return 'error';
  } catch (error) {
    logger.error('Encryption health check failed', { error });
    return 'error';
  }
}

/**
 * Health Check Handler
 * Prüft den Status aller kritischen Services
 */
export function createHealthCheckHandler(dependencies: HealthCheckDependencies) {
  const startTime = Date.now();
  
  return async (_req: Request, res: Response) => {
    const checks = {
      api: 'ok' as const,
      database: await checkDatabase(dependencies.prisma),
      encryption: checkEncryption(dependencies.encryptionService),
    };

    // Bestimme Gesamt-Status
    const allHealthy = Object.values(checks).every((check) => check === 'ok');
    const hasErrors = Object.values(checks).some((check) => check === 'error');
    
    let status: 'ok' | 'degraded' | 'error';
    if (allHealthy) {
      status = 'ok';
    } else if (hasErrors && checks.api === 'ok') {
      status = 'degraded'; // API läuft, aber Dependencies haben Probleme
    } else {
      status = 'error';
    }

    const result: HealthCheckResult = {
      status,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000), // Sekunden
      version: '0.1.0',
    };

    // HTTP Status Code basierend auf Health Status
    const httpStatus = status === 'ok' ? 200 : status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(result);
  };
}

/**
 * Liveness Check Handler
 * Einfacher Check, ob die API läuft (für Kubernetes/Docker)
 */
export function createLivenessHandler() {
  return (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'API is alive',
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Readiness Check Handler
 * Prüft, ob die API bereit ist, Requests zu verarbeiten
 */
export function createReadinessHandler(dependencies: HealthCheckDependencies) {
  return async (_req: Request, res: Response) => {
    const checks = {
      database: await checkDatabase(dependencies.prisma),
      encryption: checkEncryption(dependencies.encryptionService),
    };

    const isReady = Object.values(checks).every((check) => check === 'ok');
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

