import { useEffect, useState } from 'react';
import { request } from './api';
import type { TicketWithComments } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TicketDetail({ id }: { id: number }) {
  const [ticket, setTicket] = useState<TicketWithComments | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setTicket(null);
    setError(null);
    request<TicketWithComments>(`/tickets/${id}`, { signal: ac.signal })
      .then(setTicket)
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => ac.abort();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!ticket) return <p className="muted">Loading ticket…</p>;

  return (
    <div>
      <p>
        <a href="#/">← Back to tickets</a>
      </p>
      <h2>{ticket.subject}</h2>
      <dl className="ticket-meta">
        <dt>Status</dt>
        <dd>
          <span className={`badge status-${ticket.status}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </dd>
        <dt>Priority</dt>
        <dd>{ticket.priority}</dd>
        <dt>Assignee</dt>
        <dd>{ticket.assigneeName ?? '—'}</dd>
        <dt>SLA hours</dt>
        <dd>{ticket.slaHours}</dd>
        <dt>SLA</dt>
        <dd>
          <span className={`badge sla-${ticket.slaStatus}`}>
            {ticket.slaStatus.replace('_', ' ')}
          </span>
        </dd>
        <dt>Created</dt>
        <dd>{formatDate(ticket.createdAt)}</dd>
      </dl>
      <p className="description">{ticket.description}</p>

      <h3>Comments ({ticket.comments.length})</h3>
      {ticket.comments.length === 0 ? (
        <p className="muted">No comments yet.</p>
      ) : (
        <ul className="comments">
          {ticket.comments.map((comment) => (
            <li key={comment.id}>
              <div className="comment-header">
                <strong>{comment.authorName}</strong>
                <span className="muted"> · {formatDate(comment.createdAt)}</span>
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
