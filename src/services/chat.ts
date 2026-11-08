import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const ConversationSchema = z.object({
  conversationId: z.string(), status: z.string(), createdAt: z.string().optional(),
}).loose();
export type Conversation = z.infer<typeof ConversationSchema>;

export const ChatMessageSchema = z.object({
  messageId: z.string().optional(), sequence: z.number().optional(), body: z.string(),
  senderType: z.string().optional(), sender: z.string().optional(), role: z.string().optional(), createdAt: z.string().optional(),
}).loose().transform((m) => ({ ...m, sender: m.sender ?? m.senderType ?? m.role }));
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const conversations = () =>
  api('/api/v1/live-chat/conversations', { schema: z.object({ items: z.array(ConversationSchema) }).transform((r) => r.items) }).then((r) => r as Conversation[]);
export const openConversation = () =>
  api('/api/v1/live-chat/conversations', { method: 'POST', body: {}, schema: z.object({ conversation: ConversationSchema }).transform((r) => r.conversation) }).then((r) => r as Conversation);
export const messages = (id: string) =>
  api(`/api/v1/live-chat/conversations/${id}/messages`, { schema: z.object({ items: z.array(ChatMessageSchema) }).transform((r) => r.items) }).then((r) => r as ChatMessage[]);
export const sendMessage = (id: string, body: string) =>
  api(`/api/v1/live-chat/conversations/${id}/messages`, { method: 'POST', body: { body }, schema: z.object({ message: ChatMessageSchema }).transform((r) => r.message) }).then((r) => r as ChatMessage);
export const markRead = (id: string) => api(`/api/v1/live-chat/conversations/${id}/read`, { method: 'POST', body: {} });
export const closeConversation = (id: string) => api(`/api/v1/live-chat/conversations/${id}/close`, { method: 'POST', body: {} });
export const reopenConversation = (id: string) => api(`/api/v1/live-chat/conversations/${id}/reopen`, { method: 'POST', body: {} });

// SSE events endpoint exists at GET /live-chat/events — EventSource can't send
// Authorization headers on RN, so we poll messages instead (GET-only refresh).
export const useConversations = () => useQuery({ queryKey: ['chat-conversations'], queryFn: conversations, staleTime: 30_000 });
export const useMessages = (id?: string) =>
  useQuery({ queryKey: ['chat-messages', id], queryFn: () => messages(id!), enabled: !!id, staleTime: 5_000, refetchInterval: 10_000 });
