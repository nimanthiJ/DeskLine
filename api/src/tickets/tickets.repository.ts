import { pool } from '../db';
import { toTicketDto, type TicketDto, type TicketRow } from '../mappers';
import * as usersRepository from '../users/users.repository';

export interface ListTicketsFilter {
  statuses?: string[];
  assigneeIds?: number[];
  includeUnassigned?: boolean;
}

export async function listTickets(filter: ListTicketsFilter = {}): Promise<TicketDto[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.statuses && filter.statuses.length > 0) {
    params.push(filter.statuses);
    conditions.push(`t.status = any($${params.length}::text[])`);
  }

  const assigneeParts: string[] = [];
  if (filter.assigneeIds && filter.assigneeIds.length > 0) {
    params.push(filter.assigneeIds);
    assigneeParts.push(`t.assignee_id = any($${params.length}::int[])`);
  }
  if (filter.includeUnassigned) {
    assigneeParts.push('t.assignee_id is null');
  }
  if (assigneeParts.length > 0) {
    conditions.push(`(${assigneeParts.join(' or ')})`);
  }

  const where =
    conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';

  const { rows } = await pool.query(
    `select t.*, u.name as assignee_name,
            (select count(*) from comments c where c.ticket_id = t.id) as comment_count
       from tickets t
       left join users u on u.id = t.assignee_id
       ${where}
      order by t.created_at desc`,
    params
  );

  return rows.map((row) =>
    toTicketDto(row, row.assignee_name ?? null, Number(row.comment_count))
  );
}

export async function getTicketById(id: number): Promise<TicketDto | null> {
  const { rows } = await pool.query(
    `select t.*, u.name as assignee_name,
            (select count(*) from comments c where c.ticket_id = t.id) as comment_count
       from tickets t
       left join users u on u.id = t.assignee_id
      where t.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return toTicketDto(row, row.assignee_name ?? null, Number(row.comment_count));
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority: string;
  assigneeId: number | null;
  slaHours: number;
}

export async function createTicket(input: CreateTicketInput): Promise<TicketDto> {
  const { rows } = await pool.query<TicketRow>(
    `insert into tickets (subject, description, status, priority, assignee_id, sla_hours)
     values ($1, $2, 'open', $3, $4, $5)
     returning *`,
    [input.subject, input.description, input.priority, input.assigneeId, input.slaHours]
  );
  const row = rows[0];
  const assigneeName = row.assignee_id
    ? await usersRepository.findNameById(row.assignee_id)
    : null;
  return toTicketDto(row, assigneeName, 0);
}

export async function updateStatus(id: number, status: string): Promise<void> {
  await pool.query(
    `update tickets
        set status = $1,
            resolved_at = case when $1 = 'resolved' then now() else null end
      where id = $2`,
    [status, id]
  );
}
