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

  it('returns 404 for an unknown ticket', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/999' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Ticket 999 not found' });
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
