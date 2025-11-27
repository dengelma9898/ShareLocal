// Domain Entity: Message
// Repräsentiert eine einzelne Chat-Nachricht

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export class Message {
  constructor(private data: MessageEntity) {}

  get id(): string {
    return this.data.id;
  }

  get conversationId(): string {
    return this.data.conversationId;
  }

  get senderId(): string {
    return this.data.senderId;
  }

  get content(): string {
    return this.data.content;
  }

  get read(): boolean {
    return this.data.read;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  markAsRead(): void {
    this.data.read = true;
  }

  toJSON(): MessageEntity {
    return {
      id: this.data.id,
      conversationId: this.data.conversationId,
      senderId: this.data.senderId,
      content: this.data.content,
      read: this.data.read,
      createdAt: this.data.createdAt,
    };
  }
}

