import { apiRequest } from "@/utils/api-client";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string; // Real DB field
}

export interface Chat {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants?: any[];
}

/**
 * 1. Initialize or Get existing Chat
 */
export const createOrGetChat = async (
  participantId: string,
): Promise<string> => {
  const chat = await apiRequest<Chat>({
    method: "post",
    url: "/api/chats",
    data: { participantId },
  });
  return chat.id;
};

/**
 * 2. Get Message History
 */
export const getMessages = async (chatId: string): Promise<ChatMessage[]> => {
  return await apiRequest<ChatMessage[]>({
    method: "get",
    url: `/api/chats/${chatId}/messages`,
  });
};

/**
 * 3. Send Message via REST (Socket is handled by backend publish)
 */
export const sendMessage = async (
  chatId: string,
  content: string,
): Promise<ChatMessage> => {
  return await apiRequest<ChatMessage>({
    method: "post",
    url: `/api/chats/${chatId}/messages`,
    data: { content },
  });
};

/**
 * 4. Request Support (System notification)
 */
export const requestSupport = async (
  chatId: string,
  requesterId: string,
): Promise<void> => {
  await apiRequest({
    method: "post",
    url: `/api/chats/${chatId}/support-request`,
    data: { requesterId },
  });
};

/**
 * 5. Assign Manager (Support Side)
 */
export const assignSupportManager = async (
  chatId: string,
  managerId: string,
): Promise<void> => {
  await apiRequest({
    method: "post",
    url: `/api/chats/${chatId}/assign`,
    data: { managerId },
  });
};

/**
 * 6. Close Support Request
 */
export const closeSupportRequest = async (chatId: string): Promise<void> => {
  await apiRequest({
    method: "post",
    url: `/api/chats/${chatId}/close`,
  });
};
