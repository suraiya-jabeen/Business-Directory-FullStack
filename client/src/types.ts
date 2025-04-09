// client/src/types.ts
export interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    senderEmail?: string;
    receiverEmail?: string;
  }
  
  export interface UserResult {
    _id: string;
    email: string;
    role: string;
    businessName?: string;
  }
  
  export interface MessageComposerProps {
    open: boolean;
    onClose: () => void;
    senderId: string;
    onMessageSent: () => void;
  }