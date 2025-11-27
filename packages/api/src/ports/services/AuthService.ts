// Port: Authentication Service Interface
// Kann später durch verschiedene Implementierungen ersetzt werden (JWT, OAuth, etc.)

export interface AuthService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateToken(payload: { userId: string; email: string }): string;
  verifyToken(token: string): { userId: string; email: string } | null;
}

