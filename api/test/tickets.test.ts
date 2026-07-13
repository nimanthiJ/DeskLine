import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from '../src/server';
import { pool } from '../src/db';
import { ensureTestDatabase, resetDatabase } from './helpers';

const app = buildServer({ logger: false });

beforeAll(async () => {
  await ensureTestDatabase();
  await app.ready();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('GET /tickets', () => {
  it('returns all tickets with assignee name and comment count', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets' });

    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(3);
    expect(tickets.map((t: { subject: string }) => t.subject)).toEqual([
      'Unassigned question',
      'Printer on fire',
      'Slow reports page',
    ]);

    const printer = tickets.find((t: any) => t.subject === 'Printer on fire');
    expect(printer).toMatchObject({
      status: 'open',
      priority: 'urgent',
      assigneeName: 'Ada Fixture',
      commentCount: 2,
      slaHours: 4,
    });
    expect(printer.createdAt).toBeTypeOf('string');

    const reports = tickets.find((t: any) => t.subject === 'Slow reports page');
    expect(reports).toMatchObject({
      status: 'in_progress',
      priority: 'medium',
      assigneeName: 'Grace Fixture',
      commentCount: 1,
      slaHours: 24,
    });

    const unassigned = tickets.find((t: any) => t.subject === 'Unassigned question');
    expect(unassigned.assigneeId).toBeNull();
    expect(unassigned.assigneeName).toBeNull();
    expect(unassigned.commentCount).toBe(0);
  });

  it('loads the list without per-ticket follow-up queries', async () => {
    const querySpy = vi.spyOn(pool, 'query');
    querySpy.mockClear();

    const res = await app.inject({ method: 'GET', url: '/tickets' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(3);
    expect(querySpy).toHaveBeenCalledTimes(1);

    querySpy.mockRestore();
  });

  it('includes slaStatus for each ticket', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets' });

    expect(res.statusCode).toBe(200);
    const tickets = res.json();

    // Printer: open, 4h SLA, created 3h ago → ~1h remaining → at_risk
    expect(tickets.find((t: any) => t.subject === 'Printer on fire').slaStatus).toBe(
      'at_risk'
    );
    // Slow reports: in_progress, 24h SLA, created 2 days ago → breached
    expect(tickets.find((t: any) => t.subject === 'Slow reports page').slaStatus).toBe(
      'breached'
    );
    // Unassigned: open, 8h SLA, created 1h ago → on_track
    expect(tickets.find((t: any) => t.subject === 'Unassigned question').slaStatus).toBe(
      'on_track'
    );
  });

  it('marks near-deadline tickets at_risk and finished tickets complete', async () => {
    await pool.query(`
      insert into tickets (subject, description, status, priority, assignee_id, sla_hours, created_at, updated_at, resolved_at) values
        ('Almost due', 'Needs attention soon.', 'open', 'high', 1, 4, now() - interval '3 hours', now() - interval '3 hours', null),
        ('Already fixed', 'Issue was resolved.', 'resolved', 'medium', 1, 8, now() - interval '1 day', now() - interval '1 hour', now() - interval '1 hour'),
        ('Spam closed', 'Not a real issue.', 'closed', 'low', null, 8, now() - interval '5 days', now() - interval '4 days', null)
    `);

    const res = await app.inject({ method: 'GET', url: '/tickets' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();

    // Almost due: open, 4h SLA, created 3h ago → ~1h remaining → at_risk
    expect(tickets.find((t: any) => t.subject === 'Almost due').slaStatus).toBe('at_risk');
    expect(tickets.find((t: any) => t.subject === 'Already fixed').slaStatus).toBe('complete');
    expect(tickets.find((t: any) => t.subject === 'Spam closed').slaStatus).toBe('complete');
  });

  it('filters by a single status', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=open' });

    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets.map((t: { subject: string }) => t.subject)).toEqual([
      'Unassigned question',
      'Printer on fire',
    ]);
  });

  it('filters by multiple statuses', async () => {
    await pool.query(`
      update tickets set status = 'resolved', resolved_at = now()
       where subject = 'Slow reports page'
    `);

    const res = await app.inject({
      method: 'GET',
      url: '/tickets?status=open&status=resolved',
    });

    expect(res.statusCode).toBe(200);
    const subjects = res.json().map((t: { subject: string }) => t.subject);
    expect(subjects).toEqual([
      'Unassigned question',
      'Printer on fire',
      'Slow reports page',
    ]);
  });

  it('filters by assigneeId', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?assigneeId=1' });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((t: { subject: string }) => t.subject)).toEqual([
      'Printer on fire',
    ]);
  });

  it('filters unassigned tickets with assigneeId=unassigned', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/tickets?assigneeId=unassigned',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((t: { subject: string }) => t.subject)).toEqual([
      'Unassigned question',
    ]);
  });

  it('combines status and assignee filters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/tickets?status=open&assigneeId=1&assigneeId=unassigned',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((t: { subject: string }) => t.subject)).toEqual([
      'Unassigned question',
      'Printer on fire',
    ]);
  });

  it('rejects an invalid status filter with 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=nope' });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });
});

describe('GET /tickets/:id', () => {
  it('returns the ticket with its comments', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/1' });

    expect(res.statusCode).toBe(200);
    const ticket = res.json();
    expect(ticket.subject).toBe('Printer on fire');
    expect(ticket.comments).toHaveLength(2);
    expect(ticket.comments[0]).toMatchObject({
      ticketId: 1,
      authorName: 'Grace Fixture',
      body: 'Extinguisher deployed, assessing damage.',
    });
  });

  it('includes slaHours and slaStatus on the ticket detail', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/1' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      slaHours: 4,
      slaStatus: 'at_risk',
    });
  });

  it('returns 404 for an unknown ticket', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/999' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Ticket 999 not found' });
  });
});

describe('GET /users', () => {
  it('returns all users with id and name', async () => {
    const res = await app.inject({ method: 'GET', url: '/users' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { id: 1, name: 'Ada Fixture' },
      { id: 2, name: 'Grace Fixture' },
    ]);
  });
});

describe('POST /tickets', () => {
  it('creates a ticket with defaults applied', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        subject: 'Keyboard missing keys',
        description: 'The E and R keys have vanished.',
      },
    });

    expect(res.statusCode).toBe(201);
    const ticket = res.json();
    expect(ticket).toMatchObject({
      subject: 'Keyboard missing keys',
      status: 'open',
      priority: 'medium',
      assigneeId: null,
      assigneeName: null,
      slaHours: 8,
      commentCount: 0,
      resolvedAt: null,
    });
  });

  it('rejects an invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: { subject: '' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });

  it('rejects an unknown assigneeId with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        subject: 'Needs an agent',
        description: 'Please assign someone who exists.',
        assigneeId: 999999,
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Unknown assignee 999999' });
  });
});

describe('PATCH /tickets/:id/status', () => {
  it('updates the status and returns the ticket', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'in_progress' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('in_progress');
  });

  it('rejects an unknown status value', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'archived' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('clears resolvedAt when a resolved ticket is reopened', async () => {
    const resolved = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'resolved' },
    });
    expect(resolved.statusCode).toBe(200);
    expect(resolved.json().resolvedAt).toBeTypeOf('string');

    const reopened = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'open' },
    });

    expect(reopened.statusCode).toBe(200);
    expect(reopened.json()).toMatchObject({
      status: 'open',
      resolvedAt: null,
    });
  });

  it('bumps updatedAt and preserves createdAt when status changes', async () => {
    const before = await app.inject({ method: 'GET', url: '/tickets/1' });
    expect(before.statusCode).toBe(200);
    const { createdAt, updatedAt: previousUpdatedAt } = before.json();

    const res = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'in_progress' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('in_progress');
    expect(res.json().createdAt).toBe(createdAt);
    expect(new Date(res.json().updatedAt).getTime()).toBeGreaterThan(
      new Date(previousUpdatedAt).getTime()
    );
  });
});
