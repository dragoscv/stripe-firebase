import { BasicEntity } from './basic';
import { AppUser } from './user';

export interface ChatMessage extends BasicEntity {
    conversationId: string;
    sender: AppUser;
    message: string;
    timestamp: Date;
    // ...other message-specific properties...
}

export interface ChatConversation extends BasicEntity {
    participants: AppUser[];
    messages: ChatMessage[];
    // ...other conversation-specific properties...
}
