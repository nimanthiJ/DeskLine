import { useEffect, useMemo, useState } from 'react';
import { request } from './api';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import type { SlaStatus, Ticket, TicketStatus, User } from './types';

const STATUS_OPTIONS: TicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];

const UNASSIGNED = 'unassigned';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatSlaStatus(status: SlaStatus): string {
  return status.replace('_', ' ');
}

function formatStatus(status: TicketStatus): string {
  return status.replace('_', ' ');
}

function buildTicketsUrl(statuses: TicketStatus[], assignees: string[]): string {
  const params = new URLSearchParams();
  for (const status of statuses) {
    params.append('status', status);
  }
  for (const assignee of assignees) {
    params.append('assigneeId', assignee);
  }
  const query = params.toString();
  return query ? `/tickets?${query}` : '/tickets';
}

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<TicketStatus[]>([]);
  const [draftAssignees, setDraftAssignees] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<TicketStatus[]>([]);
  const [appliedAssignees, setAppliedAssignees] = useState<string[]>([]);

  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map((status) => ({ value: status, label: formatStatus(status) })),
    []
  );

  const assigneeOptions = useMemo(
    () => [
      { value: UNASSIGNED, label: 'Unassigned' },
      ...users.map((user) => ({ value: String(user.id), label: user.name })),
    ],
    [users]
  );

  useEffect(() => {
    request<User[]>('/users')
      .then(setUsers)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    setTickets(null);
    setError(null);
    request<Ticket[]>(buildTicketsUrl(appliedStatuses, appliedAssignees))
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
  }, [appliedStatuses, appliedAssignees]);

  function applyFilters() {
    setAppliedStatuses(draftStatuses);
    setAppliedAssignees(draftAssignees);
  }

  function clearFilters() {
    setDraftStatuses([]);
    setDraftAssignees([]);
    setAppliedStatuses([]);
    setAppliedAssignees([]);
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="ticket-filters">
        <SearchableMultiSelect
          label="Status"
          options={statusOptions}
          selected={draftStatuses}
          onChange={(next) => setDraftStatuses(next as TicketStatus[])}
          placeholder="All statuses"
          searchPlaceholder="Search status…"
        />

        <SearchableMultiSelect
          label="Assignee"
          options={assigneeOptions}
          selected={draftAssignees}
          onChange={setDraftAssignees}
          placeholder="All assignees"
          searchPlaceholder="Search assignee…"
        />

        <div className="filter-actions">
          <button type="button" onClick={applyFilters}>
            Apply
          </button>
          <button type="button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {!tickets ? (
        <p className="muted">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <p className="muted">No tickets match these filters.</p>
      ) : (
        <table className="ticket-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Status</th>
              <th>SLA</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Comments</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <a href={`#/tickets/${ticket.id}`}>{ticket.subject}</a>
                </td>
                <td>
                  <span className={`badge status-${ticket.status}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </td>
                <td>
                  <span className={`badge sla-${ticket.slaStatus}`}>
                    {formatSlaStatus(ticket.slaStatus)}
                  </span>
                </td>
                <td>{ticket.priority}</td>
                <td>{ticket.assigneeName ?? '—'}</td>
                <td>{ticket.commentCount}</td>
                <td>{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
