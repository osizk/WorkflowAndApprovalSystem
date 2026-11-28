import React, { useEffect, useRef, useState } from 'react';

export function usePagination<T>(rows: T[]) {
  const [size, setSize] = useState(10);
  const [selected, setPage] = useState(1);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(selected, pages);
  const start = (page - 1) * size;
  return {
    visible: rows.slice(start, start + size), page, pages, size, total, start, setPage,
    changeSize(value: number) { setSize(value); setPage(1); },
  };
}

export function Pagination({ pagination }: { pagination: ReturnType<typeof usePagination<unknown>> }) {
  const { page, pages, size, total, start, changeSize, setPage } = pagination;
  const [target, setTarget] = useState('');
  const targetPage = Number(target);
  const validTarget = /^\d+$/.test(target) && targetPage >= 1 && targetPage <= pages;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  return <div className="workspace-pagination">
    <label>Rows per page <select value={size} onChange={(event) => changeSize(Number(event.target.value))}>
      {[10, 15, 30].map((value) => <option key={value}>{value}</option>)}
    </select></label>
    <p role="status">{total ? `${start + 1}–${Math.min(start + size, total)} of ${total} requests` : '0 requests'}</p>
    {pages > 1 && <nav aria-label="Pagination">
      <button className="secondary-action" type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      {numbers.map((number, index) => <React.Fragment key={number}>
        {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
        <button className="secondary-action" type="button" aria-label={`Page ${number}`}
          aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>
      </React.Fragment>)}
      <button className="secondary-action" type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
    </nav>}
    {pages > 1 && <form className="pagination-jump" onSubmit={(event) => {
      event.preventDefault();
      if (!validTarget) return;
      setPage(targetPage);
      setTarget('');
    }}>
      <label>Go to page <input type="text" inputMode="numeric" value={target}
        onChange={(event) => setTarget(event.target.value)} aria-invalid={target !== '' && !validTarget} /></label>
      <button className="secondary-action" type="submit" disabled={!validTarget}>Go</button>
      {target !== '' && !validTarget && <span className="error" role="status">Enter a whole number from 1 to {pages}.</span>}
    </form>}
  </div>;
}

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
