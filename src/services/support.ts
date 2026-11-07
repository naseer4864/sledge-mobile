import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';

export const TicketSchema = z.object({
  ticketId: z.string(), subject: z.string(), category: z.string().optional(),
  status: z.string(), priority: z.string().optional(), createdAt: z.string().optional(),
  updatedAt: z.string().optional(), lastActivityAt: z.string().optional(),
}).loose();
export type Ticket = z.infer<typeof TicketSchema>;

export const TicketMessageSchema = z.object({
  messageId: z.string().optional(), body: z.string(), sender: z.string().optional(),
  role: z.string().optional(), createdAt: z.string().optional(),
}).loose();
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#F79009' }, in_progress: { label: 'In progress', color: '#4778F5' },
  waiting_customer: { label: 'Awaiting you', color: '#F79009' }, resolved: { label: 'Resolved', color: '#12B76A' },
  closed: { label: 'Closed', color: '#667085' }, reopened: { label: 'Reopened', color: '#F79009' },
};

export const tickets = () =>
  api('/api/v1/support/tickets', { schema: z.object({ tickets: z.array(TicketSchema) }).transform((r) => r.tickets) }).then((r) => r as Ticket[]);
export const ticket = (id: string) =>
  api(`/api/v1/support/tickets/${id}`, { schema: TicketSchema }).then((r) => r as Ticket);
export const ticketMessages = (id: string) =>
  api(`/api/v1/support/tickets/${id}`, { schema: z.object({ messages: z.array(TicketMessageSchema).optional() }).loose() })
    .then((r) => (r as { messages?: TicketMessage[] }).messages ?? []);
export const createTicket = (subject: string, description: string, category: string, idempotencyKey: string) =>
  api('/api/v1/support/tickets', { method: 'POST', body: { subject, description, category, idempotencyKey }, schema: TicketSchema }).then((r) => r as Ticket);
export const replyTicket = (id: string, body: string) =>
  api(`/api/v1/support/tickets/${id}/messages`, { method: 'POST', body: { body }, schema: z.object({}).loose() });
export const closeTicket = (id: string) => api(`/api/v1/support/tickets/${id}/close`, { method: 'POST', body: {} });
export const reopenTicket = (id: string) => api(`/api/v1/support/tickets/${id}/reopen`, { method: 'POST', body: {} });

export const useTickets = () => useQuery({ queryKey: ['support-tickets'], queryFn: tickets, staleTime: 30_000 });
export const useTicket = (id?: string) => useQuery({ queryKey: ['support-ticket', id], queryFn: () => ticket(id!), enabled: !!id, staleTime: 15_000 });
export const useTicketMessages = (id?: string) => useQuery({ queryKey: ['support-messages', id], queryFn: () => ticketMessages(id!), enabled: !!id, staleTime: 10_000 });
