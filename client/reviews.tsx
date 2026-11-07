import React, { useEffect, useState, type Ref } from 'react';

type Summary = { id: string; title: string; amount: string; currency: string; status: string };
type Detail = Summary & {
  purpose: string;
  history: { id: string; type: string; createdAt: string; reason: string | null }[];
};
type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export function ReviewWorkspace({ heading }: { heading: Ref<HTMLHeadingElement> }) {
  const id = /^\/reviews\/([^/]+)$/.exec(window.location.pathname)?.[1];
  const api = id ? '/api/requests/' + encodeURIComponent(id) : '/api/requests';
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<Summary[]>([]);
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

  useEffect(() => {
    const controller = new AbortController();
    fetch(api, { signal: controller.signal }).then(async (response) => {
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
  }, [api, id, revision]);

  async function decide(decision: 'APPROVE' | 'REJECT') {
    if (busy || !request || request.status !== 'SUBMITTED') return;
    setError('');
    setReasonError('');
    const trimmed = reason.trim();
    if (decision === 'REJECT' && !trimmed) {
      setReasonError('A rejection reason is required.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(api + '/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, ...(trimmed && { reason: trimmed }) }),
      });
      if (response.status === 401) return window.location.replace('/login');
      if (response.status === 404) return setState('missing');
      if (response.status === 409) {
        setError('This request was already decided. The latest status is being loaded.');
        refresh();
        return;
      }
      if (response.status === 422) {
        const { error: validation } = await response.json();
        setReasonError(validation.fields?.reason ?? 'Check the decision reason.');
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

  return <div className="workspace">
    <h1 id="page-title" ref={heading} tabIndex={-1}>{id ? 'Review request' : 'Review queue'}</h1>
    {id && <a href="/reviews">Back to review queue</a>}
    {error && <p className="error" role="alert">{error}</p>}
    {saved && <p role="status">Decision saved.</p>}
    {state === 'loading' && <p role="status">Loading review information…</p>}
    {state === 'missing' && <p role="alert">Request not found.</p>}
    {state === 'error' && <>
      <p role="alert">Could not load review information.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </>}
    {state === 'ready' && !id && (items.length ? <ul className="request-list">
      {items.map((item) => <li key={item.id}>
        <a href={'/reviews/' + item.id}>{item.title}</a>
        <span>{item.amount} {item.currency} · {item.status}</span>
      </li>)}
    </ul> : <p role="status">No requests are assigned to you.</p>)}
    {state === 'ready' && request && <div className="request-detail">
      <h2>{request.title}</h2>
      <p><strong>Status:</strong> {request.status}</p>
      <p><strong>Amount:</strong> {request.amount} {request.currency}</p>
      <p><strong>Purpose:</strong> {request.purpose}</p>
      <h3>History</h3>
      <ol>{request.history.map((event) => <li key={event.id}>
        {event.type} · {new Date(event.createdAt).toLocaleString()}{event.reason && ' · ' + event.reason}
      </li>)}</ol>
      {request.status === 'SUBMITTED' && <div className="decision-controls" aria-busy={busy}>
        <label htmlFor="decision-reason">Reason</label>
        <textarea id="decision-reason" value={reason} onChange={(event) => setReason(event.target.value)}
          aria-invalid={!!reasonError} aria-describedby={reasonError ? 'reason-help reason-error' : 'reason-help'} />
        <p id="reason-help">Required to reject. Optional to approve.</p>
        {reasonError && <p id="reason-error" className="error" role="alert">{reasonError}</p>}
        <div className="decision-actions">
          <button type="button" disabled={busy} onClick={() => void decide('APPROVE')}>Approve</button>
          <button type="button" disabled={busy} onClick={() => void decide('REJECT')}>Reject</button>
        </div>
        {busy && <p role="status">Saving decision…</p>}
      </div>}
    </div>}
  </div>;
}
