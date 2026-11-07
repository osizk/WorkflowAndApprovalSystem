import React, { useEffect, useState, type FormEvent, type Ref } from 'react';

type Summary = { id: string; title: string; amount: string; currency: string; status: string; createdAt: string };
type Detail = Summary & { purpose: string; history: { id: string; type: string; createdAt: string; reason: string | null }[] };
type ApiError = { error?: { code?: string; fields?: Record<string, string> } };

function signInAgain() {
  window.location.replace('/login');
}

export function RequestWorkspace({ heading }: { heading: Ref<HTMLHeadingElement> }) {
  const path = window.location.pathname;
  const mode = path === '/requests/new' ? 'new' : path === '/requests' ? 'list' : 'detail';
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'missing' | 'error'>(mode === 'new' ? 'ready' : 'loading');
  const [retry, setRetry] = useState(0);
  const [requests, setRequests] = useState<Summary[]>([]);
  const [request, setRequest] = useState<Detail>();
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'new') return;
    const controller = new AbortController();
    const url = mode === 'list' ? '/api/requests' : `/api/requests/${encodeURIComponent(path.slice('/requests/'.length))}`;
    fetch(url, { signal: controller.signal }).then(async (response) => {
      if (response.status === 401) return signInAgain();
      if (response.status === 404) return setState('missing');
      if (!response.ok) throw new Error('Request load failed');
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (mode === 'list') {
        setRequests(data.requests);
        setState(data.requests.length ? 'ready' : 'empty');
      } else {
        setRequest(data.request);
        setState('ready');
      }
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [mode, path, retry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFields({});
    setMessage('');
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, purpose, amount }),
      });
      if (response.status === 401) return signInAgain();
      if (response.status === 422) {
        const data = await response.json() as ApiError;
        setFields(data.error?.fields ?? {});
        setMessage('Check the request fields.');
        return;
      }
      if (response.status === 409) {
        setMessage('No eligible reviewer is available. Try again later.');
        return;
      }
      if (!response.ok) throw new Error('Request submission failed');
      const data = await response.json() as { request: Detail };
      window.location.assign(`/requests/${data.request.id}`);
    } catch {
      setMessage('Could not submit the request. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="workspace">
    <h1 id="page-title" tabIndex={-1} ref={heading}>{mode === 'list' ? 'My requests' : mode === 'new' ? 'New request' : 'Request detail'}</h1>
    {mode !== 'list' && <a href="/requests">Back to my requests</a>}
    {mode === 'list' && <>
      <p><a href="/requests/new">Create request</a></p>
      {state === 'loading' && <p role="status">Loading requests…</p>}
      {state === 'empty' && <p role="status">You have no requests yet.</p>}
      {state === 'ready' && <ul className="request-list">{requests.map((item) => <li key={item.id}>
        <a href={`/requests/${item.id}`}>{item.title}</a>
        <span>{item.amount} {item.currency} · {item.status}</span>
      </li>)}</ul>}
    </>}
    {mode === 'new' && <form onSubmit={submit} aria-busy={submitting} noValidate>
      <label htmlFor="request-title">Title</label>
      <input id="request-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={!!fields.title} aria-describedby={fields.title ? 'title-error' : undefined} required />
      {fields.title && <p id="title-error" className="error">{fields.title}</p>}
      <label htmlFor="request-purpose">Purpose</label>
      <textarea id="request-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} aria-invalid={!!fields.purpose} aria-describedby={fields.purpose ? 'purpose-error' : undefined} required />
      {fields.purpose && <p id="purpose-error" className="error">{fields.purpose}</p>}
      <label htmlFor="request-amount">Amount (THB)</label>
      <input id="request-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={!!fields.amount} aria-describedby={fields.amount ? 'amount-error' : undefined} required />
      {fields.amount && <p id="amount-error" className="error">{fields.amount}</p>}
      {message && <p role="alert" className="error">{message}</p>}
      <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</button>
    </form>}
    {mode === 'detail' && <>
      {state === 'loading' && <p role="status">Loading request…</p>}
      {state === 'missing' && <p role="alert">Request not found.</p>}
      {state === 'ready' && request && <div className="request-detail">
        <h2>{request.title}</h2>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Amount:</strong> {request.amount} {request.currency}</p>
        <p><strong>Purpose:</strong> {request.purpose}</p>
        <h3>History</h3>
        <ol>{request.history.map((event) => <li key={event.id}>{event.type} · {new Date(event.createdAt).toLocaleString()}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ol>
      </div>}
    </>}
    {state === 'error' && <><p role="alert">Could not load requests.</p><button onClick={() => { setState('loading'); setRetry((value) => value + 1); }}>Try again</button></>}
  </div>;
}
