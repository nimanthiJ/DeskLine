import { z } from 'zod';

export const ticketIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const ticketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);

function asOptionalArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());
}

export const listTicketsQuerySchema = z.object({
  status: asOptionalArray(ticketStatusEnum),
  assigneeId: asOptionalArray(
    z.union([z.literal('unassigned'), z.coerce.number().int().positive()])
  ),
});

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.number().int().positive().nullable().default(null),
  slaHours: z.number().int().positive().default(8),
});

export const updateStatusSchema = z.object({
  status: ticketStatusEnum,
});
