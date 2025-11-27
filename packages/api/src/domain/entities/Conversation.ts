// Domain Entity: Conversation
// Repräsentiert eine Chat-Konversation zwischen Nutzern

export interface ConversationEntity {
  id: string;
  listingId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  constructor(private data: ConversationEntity) {}

  get id(): string {
    return this.data.id;
  }

  get listingId(): string | null {
    return this.data.listingId;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  toJSON(): ConversationEntity {
    return {
      id: this.data.id,
      listingId: this.data.listingId,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    };
  }
}

