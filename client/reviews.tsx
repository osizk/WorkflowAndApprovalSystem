import React, { useEffect, useState, type Ref } from 'react';
import './reviewer.css';

type Summary = { id: string; title: string; amount: string; currency: string; status: string };
type Detail = Summary & {
  purpose: string;
  version: number;
  history: { id: string; type: string; createdAt: string; reason: string | null }[];
};
type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export function ReviewWorkspace({ heading }: { heading: Ref<HTMLHeadingElement> }) {
  const id = /^\/reviews\/([^/]+)$/.exec(window.location.pathname)?.[1];
  const api = id ? '/api/requests/' + encodeURIComponent(id) : '/api/requests';
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<Summary[]>([]);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const listQuery = !id && statusFilter ? '?' + new URLSearchParams({ status: statusFilter }) : '';
  const [request, setRequest] = useState<Detail>();
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function refresh() {
    setState('loading');
    setRevision((value) => value + 1);
  }

  function changeStatusFilter(value: string) {
    if (value === statusFilter) return;
    setState('loading');
    setStatusFilter(value);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(api + listQuery, { signal: controller.signal }).then(async (response) => {
      if (response.status === 401) return window.location.replace('/login');
      if (response.status === 404) return setState('missing');
      if (!response.ok) throw new Error('Load failed');
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (id) setRequest(data.request);
      else setItems(data.requests);
      setState('ready');
    }).catch(() => {
      if (!controller.signal.aborted) setState('error');
    });
    return () => controller.abort();
  }, [api, id, listQuery, revision]);

  async function decide(decision: 'APPROVE' | 'REJECT' | 'RETURN') {
    if (busy || !request || request.status !== 'SUBMITTED') return;
    setError('');
    setReasonError('');
    const trimmed = reason.trim();
    if (decision === 'REJECT' && !trimmed) {
      setReasonError('A rejection reason is required.');
      return;
    }
    if (decision === 'RETURN' && !trimmed) {
      setReasonError('A return reason is required.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(api + (decision === 'RETURN' ? '/return' : '/decision'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision === 'RETURN'
          ? { reason: trimmed, version: request.version }
          : { decision, version: request.version, ...(trimmed && { reason: trimmed }) }),
      });
      if (response.status === 401) return window.location.replace('/login');
      if (response.status === 404) return setState('missing');
      if (response.status === 409) {
        setError('This request changed. Review the latest status before trying again.');
        setReason('');
        refresh();
        return;
      }
      if (response.status === 422) {
        const { error: validation } = await response.json();
        if (validation.fields?.reason) setReasonError(validation.fields.reason);
        else setError(validation.message ?? 'Could not save the action.');
        return;
      }
      if (!response.ok) throw new Error('Decision failed');
      const data = await response.json() as { request: Detail };
      setRequest(data.request);
      setSaved(true);
    } catch {
      setError('Could not save the decision. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="workspace reviewer-page">
    <h1 id="page-title" ref={heading} tabIndex={-1}>{id ? 'Review request' : 'Review queue'}</h1>
    {id && <a href="/reviews">Back to review queue</a>}
    {!id && <div className="review-filters">
      <label htmlFor="review-status-filter">Status</label>
      <select id="review-status-filter" value={statusFilter} onChange={(event) => changeStatusFilter(event.target.value)}>
        <option value="">All statuses</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="RETURNED">Returned</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="WITHDRAWN">Withdrawn</option>
      </select>
      <button type="button" disabled={!statusFilter} onClick={() => changeStatusFilter('')}>Clear filter</button>
    </div>}
    {error && <p className="error" role="alert">{error}</p>}
    {saved && <p role="status">Decision saved.</p>}
    {state === 'loading' && <p role="status">Loading review information…</p>}
    {state === 'missing' && <p role="alert">Request not found.</p>}
    {state === 'error' && <>
      <p role="alert">Could not load review information.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </>}
    {state === 'ready' && !id && (items.length ? <div className="review-table-frame"><table className="review-table">
      <thead><tr><th scope="col">Request</th><th scope="col">Amount</th><th scope="col">Status</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}>
        <td><a href={'/reviews/' + item.id}>{item.title}</a></td>
        <td>{item.amount} {item.currency}</td>
        <td><span className="review-status" data-status={item.status}>{item.status}</span></td>
      </tr>)}</tbody>
    </table></div> : <p role="status">{statusFilter ? 'No requests match this status.' : 'No requests are assigned to you.'}</p>)}
    {state === 'ready' && request && <div className="request-detail">
      <div className="review-detail-heading">
        <h2>{request.title}</h2>
        <p><strong>Status:</strong> <span className="review-status" data-status={request.status}>{request.status}</span></p>
      </div>
      <div className="review-facts">
        <p><strong>Amount:</strong> {request.amount} {request.currency}</p>
        <p><strong>Purpose:</strong> {request.purpose}</p>
      </div>
      <h3>History</h3>
      <ol className="review-history">{request.history.map((event) => <li key={event.id} data-status={event.type}>
        {event.type} · {new Date(event.createdAt).toLocaleString()}{event.reason && ' · ' + event.reason}
      </li>)}</ol>
      {request.status === 'SUBMITTED' && <div className="decision-controls" aria-busy={busy}>
        <label htmlFor="decision-reason">Reason</label>
        <textarea id="decision-reason" value={reason} onChange={(event) => setReason(event.target.value)}
          aria-invalid={!!reasonError} aria-describedby={reasonError ? 'reason-help reason-error' : 'reason-help'} />
        <p id="reason-help">Required to reject or return. Optional to approve.</p>
        {reasonError && <p id="reason-error" className="error" role="alert">{reasonError}</p>}
        <div className="decision-actions">
          <button type="button" disabled={busy} onClick={() => void decide('APPROVE')}>Approve</button>
          <button type="button" disabled={busy} onClick={() => void decide('REJECT')}>Reject</button>
          <button type="button" disabled={busy} onClick={() => void decide('RETURN')}>Return</button>
        </div>
        {busy && <p role="status">Saving decision…</p>}
      </div>}
    </div>}
  </div>;
}
