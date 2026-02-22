// Common fields for all notifications
export interface BaseNotification {
  id: string | number;
  isRead?: boolean;
  message?: string; // Used in the UI list
  createdAt: string | Date;
}

// 1. Token Notification
export interface TokenPayload extends BaseNotification {
  type: "TOKEN";
  tokenCode?: string;
  orderNumber?: string;
  mobileNumber?: string;
  status?: string;
  data?: any; // Fallback for extra fields
}

// 2. Job Notification
export interface JobPayload extends BaseNotification {
  type: "JOB";
  description?: string;
  location?: string;
  cost?: string;
  postedBy?: string;
  data?: any;
}

// 3. Chat Message Notification (NEW)
export interface ChatMessagePayload extends BaseNotification {
  type: "CHAT_MESSAGE";
  data: {
    chatId: string;
    senderName: string;
    preview: string;
  };
}

// 4. Booking Request Notification (Used in NotificationsPage)
export interface BookingRequestPayload extends BaseNotification {
  type: "BOOKING_REQUEST";
  data: {
    bookingId: string;
    customerId?: string;
    status?: string;
  };
}

// Union Type
export type NotificationItem =
  | TokenPayload
  | JobPayload
  | ChatMessagePayload
  | BookingRequestPayload
  | (BaseNotification & { type: string; data?: any }); // Fallback for generic types

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void; // Added this missing method
  socket: any;
}
