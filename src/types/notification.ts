// Existing Booking Type
export interface BookingPayload {
  type: "BOOKING"; // Discriminator
  id: number | string;
  title: string;
  description: string;
  status: string;
  createdAt: string | Date;
}

// New Job Type
export interface JobPayload {
  type: "JOB"; // Discriminator
  id: number;
  description: string;
  location: string;
  cost: string;
  postedBy: string;
  createdAt: string | Date;
}

// Union Type for State
export type NotificationItem = BookingPayload | JobPayload;

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  socket: any;
}
