// Adapter: JWT Authentication Service Implementation
// Konkrete Implementierung des AuthService Ports

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../ports/services/AuthService.js';

export class JwtAuthService implements AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'change-me-in-production') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; email: string };
      return decoded;
    } catch {
      return null;
    }
  }
}

