import React, { useEffect, useState, type FormEvent, type Ref } from 'react';

type Summary = { id: string; title: string; amount: string; currency: string; status: string; createdAt: string };
type Detail = Summary & { purpose: string; version: number; history: { id: string; type: string; createdAt: string; reason: string | null }[] };
type ApiError = { error?: { code?: string; fields?: Record<string, string> } };

function signInAgain() {
  window.location.replace('/login');
}

export function RequestWorkspace({ heading }: { heading: Ref<HTMLHeadingElement> }) {
  const path = window.location.pathname;
  const mode = path === '/requests/new' ? 'new' : path === '/requests' ? 'list' : 'detail';
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'missing' | 'error'>(mode === 'new' ? 'ready' : 'loading');
  const [retry, setRetry] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [requests, setRequests] = useState<Summary[]>([]);
  const [request, setRequest] = useState<Detail>();
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalReasonError, setWithdrawalReasonError] = useState('');
  const [withdrawalError, setWithdrawalError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [resubmitFields, setResubmitFields] = useState<Record<string, string>>({});
  const [resubmitError, setResubmitError] = useState('');
  const [resubmitMessage, setResubmitMessage] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  function changeStatusFilter(value: string) {
    if (value === statusFilter) return;
    setState('loading');
    setStatusFilter(value);
  }

  useEffect(() => {
    if (mode === 'new') return;
    const controller = new AbortController();
    const url = mode === 'list' ? '/api/requests' : `/api/requests/${encodeURIComponent(path.slice('/requests/'.length))}`;
    const filter = mode === 'list' && statusFilter ? '?' + new URLSearchParams({ status: statusFilter }) : '';
    fetch(url + filter, { signal: controller.signal }).then(async (response) => {
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
        if (data.request.status === 'RETURNED') {
          setTitle(data.request.title);
          setPurpose(data.request.purpose);
          setAmount(data.request.amount);
        }
        setState('ready');
      }
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [mode, path, retry, statusFilter]);

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

  function changeResubmitField(field: string, value: string) {
    if (field === 'title') setTitle(value);
    if (field === 'purpose') setPurpose(value);
    if (field === 'amount') setAmount(value);
    setResubmitFields((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setResubmitError('');
    setResubmitMessage('');
  }

  async function resubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resubmitting || request?.status !== 'RETURNED') return;
    setResubmitting(true);
    setResubmitFields({});
    setResubmitError('');
    setResubmitMessage('');
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(request.id)}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, purpose, amount, version: request.version }),
      });
      if (response.status === 401) return signInAgain();
      if (response.status === 404) {
        setState('missing');
        return;
      }
      if (response.status === 409) {
        setResubmitError('This request changed. Review the latest details before trying again.');
        setState('loading');
        setRetry((value) => value + 1);
        return;
      }
      if (response.status === 422) {
        const data = await response.json() as ApiError;
        setResubmitFields(data.error?.fields ?? {});
        setResubmitError('Check the revised request fields.');
        return;
      }
      if (!response.ok) throw new Error('Request resubmission failed');
      const data = await response.json() as { request: Detail };
      setRequest(data.request);
      setResubmitMessage('Request resubmitted.');
    } catch {
      setResubmitError('Could not resubmit the request. Try again.');
    } finally {
      setResubmitting(false);
    }
  }

  function closeWithdrawal() {
    setWithdrawalOpen(false);
    setWithdrawalReason('');
    setWithdrawalReasonError('');
    setWithdrawalError('');
  }

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (withdrawing || request?.status !== 'SUBMITTED') return;
    setWithdrawalError('');
    setWithdrawalReasonError('');
    const reason = withdrawalReason.trim();
    if (!reason || [...reason].length > 500) {
      setWithdrawalReasonError('Enter 1 to 500 characters.');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(request.id)}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, version: request.version }),
      });
      if (response.status === 401) return signInAgain();
      if (response.status === 404) {
        closeWithdrawal();
        setState('missing');
        return;
      }
      if (response.status === 409) {
        closeWithdrawal();
        setWithdrawalError('This request changed before it could be withdrawn.');
        setState('loading');
        setRetry((value) => value + 1);
        return;
      }
      if (response.status === 422) {
        const data = await response.json() as ApiError;
        setWithdrawalReasonError(data.error?.fields?.reason ?? 'Check the withdrawal reason.');
        return;
      }
      if (!response.ok) throw new Error('Withdrawal failed');
      const data = await response.json() as { request: Detail };
      setRequest(data.request);
      closeWithdrawal();
      setWithdrawn(true);
    } catch {
      setWithdrawalError('Could not withdraw the request. Try again.');
    } finally {
      setWithdrawing(false);
    }
  }

  return <div className={mode === 'list' ? 'workspace requester-list-page' : 'workspace'}>
    <div className={mode === 'list' ? 'requester-list-header' : undefined}>
      <h1 id="page-title" tabIndex={-1} ref={heading}>{mode === 'list' ? 'My requests' : mode === 'new' ? 'New request' : 'Request detail'}</h1>
      {mode === 'list' && <a className="requester-create" href="/requests/new">Create request</a>}
    </div>
    {mode !== 'list' && <a href="/requests">Back to my requests</a>}
    {mode === 'list' && <>
      <div className="requester-filters">
        <label htmlFor="request-status-filter">Status</label>
        <select id="request-status-filter" value={statusFilter} onChange={(event) => changeStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="RETURNED">Returned</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
        <button type="button" disabled={!statusFilter} onClick={() => changeStatusFilter('')}>Clear filter</button>
      </div>
      {state === 'loading' && <p role="status">Loading requests…</p>}
      {state === 'empty' && <p role="status">{statusFilter ? 'No requests match this status.' : 'You have no requests yet.'}</p>}
      {state === 'ready' && <>
        <div className="requester-list-columns" aria-hidden="true"><span>Request</span><span>Amount</span><span>Status</span></div>
        <ul className="request-list" aria-label="Purchase requests">{requests.map((item) => <li key={item.id}>
        <a href={`/requests/${item.id}`}>{item.title}</a>
        <span className="requester-amount">{item.amount} {item.currency}</span>
        <span className="requester-status" data-status={item.status}>{item.status}</span>
      </li>)}</ul>
      </>}
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
      {withdrawalError && <p role="alert" className="error">{withdrawalError}</p>}
      {withdrawn && <p role="status">Request withdrawn.</p>}
      {resubmitError && <p role="alert" className="error">{resubmitError}</p>}
      {resubmitMessage && <p role="status">{resubmitMessage}</p>}
      {state === 'loading' && <p role="status">Loading request…</p>}
      {state === 'missing' && <p role="alert">Request not found.</p>}
      {state === 'ready' && request && <div className="request-detail requester-detail">
        <div className="requester-detail-summary">
          <h2>{request.title}</h2>
          <p><strong>Status:</strong> <span className="requester-status" data-status={request.status}>{request.status}</span></p>
          <p><strong>Amount:</strong> {request.amount} {request.currency}</p>
          <p><strong>Purpose:</strong> {request.purpose}</p>
        </div>
        {request.status === 'SUBMITTED' && (
          withdrawalOpen ? <form onSubmit={withdraw} aria-busy={withdrawing} noValidate>
            <label htmlFor="withdrawal-reason">Withdrawal reason</label>
            <textarea id="withdrawal-reason" value={withdrawalReason} autoFocus required disabled={withdrawing}
              onChange={(event) => setWithdrawalReason(event.target.value)}
              aria-invalid={!!withdrawalReasonError}
              aria-describedby={withdrawalReasonError ? 'withdrawal-help withdrawal-error' : 'withdrawal-help'} />
            <p id="withdrawal-help">Enter 1 to 500 characters. The reason will appear in the request history.</p>
            {withdrawalReasonError && <p id="withdrawal-error" className="error" role="alert">{withdrawalReasonError}</p>}
            <button type="submit" disabled={withdrawing}>{withdrawing ? 'Withdrawing…' : 'Confirm withdrawal'}</button>
            <button type="button" disabled={withdrawing} onClick={closeWithdrawal}>Cancel</button>
          </form> : <button type="button" onClick={() => setWithdrawalOpen(true)}>Withdraw request</button>
        )}
        {request.status === 'RETURNED' && [...request.history].reverse().find((event) => event.type === 'RETURNED')?.reason && (
          <aside className="requester-revision">
            <strong>Revision requested</strong>
            <p>{[...request.history].reverse().find((event) => event.type === 'RETURNED')?.reason}</p>
          </aside>
        )}
        {request.status === 'RETURNED' && <form className="requester-resubmit" onSubmit={resubmit} aria-busy={resubmitting} noValidate>
          <h3>Edit and resubmit</h3>
          <label htmlFor="resubmit-title">Title</label>
          <input id="resubmit-title" value={title} onChange={(event) => changeResubmitField('title', event.target.value)}
            aria-invalid={!!resubmitFields.title} aria-describedby={resubmitFields.title ? 'resubmit-title-error' : undefined} required disabled={resubmitting} />
          {resubmitFields.title && <p id="resubmit-title-error" className="error" role="alert">{resubmitFields.title}</p>}
          <label htmlFor="resubmit-purpose">Purpose</label>
          <textarea id="resubmit-purpose" value={purpose} onChange={(event) => changeResubmitField('purpose', event.target.value)}
            aria-invalid={!!resubmitFields.purpose} aria-describedby={resubmitFields.purpose ? 'resubmit-purpose-error' : undefined} required disabled={resubmitting} />
          {resubmitFields.purpose && <p id="resubmit-purpose-error" className="error" role="alert">{resubmitFields.purpose}</p>}
          <label htmlFor="resubmit-amount">Amount (THB)</label>
          <input id="resubmit-amount" inputMode="decimal" value={amount} onChange={(event) => changeResubmitField('amount', event.target.value)}
            aria-invalid={!!resubmitFields.amount} aria-describedby={resubmitFields.amount ? 'resubmit-amount-error' : undefined} required disabled={resubmitting} />
          {resubmitFields.amount && <p id="resubmit-amount-error" className="error" role="alert">{resubmitFields.amount}</p>}
          <button type="submit" disabled={resubmitting}>{resubmitting ? 'Resubmitting…' : 'Edit & Resubmit'}</button>
        </form>}
        <div className="requester-history">
          <h3>History</h3>
          <ol>{request.history.map((event) => <li key={event.id}>{event.type} · {new Date(event.createdAt).toLocaleString()}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ol>
        </div>
      </div>}
    </>}
    {state === 'error' && <><p role="alert">Could not load requests.</p><button onClick={() => { setState('loading'); setRetry((value) => value + 1); }}>Try again</button></>}
  </div>;
}
