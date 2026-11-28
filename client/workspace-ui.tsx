import React, { useEffect, useRef } from 'react';

const statuses = ['SUBMITTED', 'RETURNED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
const money = new Intl.NumberFormat('en-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatAmount = (amount: string) => '฿' + money.format(Number(amount));

export function StatusFilter({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return <div className="workspace-filters">
    <label htmlFor={id}>Status</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All statuses</option>
      {statuses.map((status) => <option key={status} value={status}>{status[0] + status.slice(1).toLowerCase()}</option>)}
    </select>
    <button className="secondary-action" type="button" disabled={!value} onClick={() => onChange('')}>Clear filter</button>
  </div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="status-badge" data-status={status}>{status}</span>;
}

type HistoryEvent = { id: string; type: string; createdAt: string; reason?: string | null };
export function RequestHistory({ events, featured }: { events: HistoryEvent[]; featured?: HistoryEvent }) {
  return <section className="history-panel">
    <h2>History</h2>
    <ol className="history-timeline">{events.map((event) => <li key={event.id} data-status={event.type}>
      <strong>{event.type}</strong> · <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
      {event.reason && event !== featured && ' · ' + event.reason}
    </li>)}</ol>
  </section>;
}

export function RevisionNote({ event }: { event?: HistoryEvent }) {
  return event?.reason ? <aside className="revision-note"><strong>Revision requested</strong><div>{event.reason}</div></aside> : null;
}

export function FormErrors({ fields, prefix }: { fields: Record<string, string>; prefix: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const errors = ['title', 'purpose', 'amount'].filter((field) => fields[field]);
  useEffect(() => { if (Object.keys(fields).length) panel.current?.focus(); }, [fields]);
  if (!errors.length) return null;
  return <div className="form-errors" ref={panel} tabIndex={-1} aria-labelledby={prefix + '-errors'}>
    <strong id={prefix + '-errors'}>Check the following fields</strong>
    <ul>{errors.map((field) => <li key={field}><a href={'#' + prefix + '-' + field} onClick={(event) => {
      event.preventDefault();
      document.getElementById(prefix + '-' + field)?.focus();
    }}>{field[0].toUpperCase() + field.slice(1)}: {fields[field]}</a></li>)}</ul>
  </div>;
}
