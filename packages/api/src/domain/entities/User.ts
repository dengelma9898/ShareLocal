// Domain Entity - User
// Pure domain logic, keine Infrastruktur-Abhängigkeiten

export interface UserEntity {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class User {
  constructor(private data: UserEntity) {}

  get id(): string {
    return this.data.id;
  }

  get email(): string {
    return this.data.email;
  }

  get name(): string {
    return this.data.name;
  }

  get role(): 'USER' | 'ADMIN' {
    return this.data.role;
  }

  isAdmin(): boolean {
    return this.data.role === 'ADMIN';
  }

  isVerified(): boolean {
    return this.data.emailVerified;
  }

  toJSON(): UserEntity {
    // Entferne passwordHash falls vorhanden (wird durch Object.assign hinzugefügt)
    const { passwordHash, ...userData } = this.data as UserEntity & { passwordHash?: string };
    return userData;
  }

  // Domain Logic Methods
  updateProfile(updates: Partial<Pick<UserEntity, 'name' | 'bio' | 'location' | 'phone' | 'avatar'>>): void {
    this.data = {
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    };
  }

  markAsDeleted(): void {
    this.data.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return this.data.deletedAt !== null;
  }
}

