import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { RequestWorkspace } from './requests';
import './style.css';

type Identity = { id: string; role: 'REQUESTER' | 'REVIEWER' };
type Screen = 'loading' | 'unavailable' | 'login' | 'signed-in';

function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [identity, setIdentity] = useState<Identity>();
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  function navigate(path: string) {
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
  }

  function showIdentity(user: Identity) {
    setIdentity(user);
    if (user.role === 'REQUESTER') {
      if (!/^\/requests(?:\/|$)/.test(window.location.pathname)) navigate('/requests');
    } else {
      navigate('/reviews');
    }
    setScreen('signed-in');
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/session', { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          navigate('/login');
          setScreen('login');
          return;
        }
        if (!response.ok) throw new Error('Session check failed');
        const user = await response.json() as Identity;
        if (!controller.signal.aborted) showIdentity(user);
      })
      .catch(() => {
        if (!controller.signal.aborted) setScreen('unavailable');
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (screen !== 'loading') heading.current?.focus();
  }, [screen]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: form.get('login'), password: form.get('password') }),
      });
      if (response.status === 401) {
        setError('Invalid credentials');
        return;
      }
      if (!response.ok) throw new Error('Login failed');
      showIdentity(await response.json() as Identity);
    } catch {
      setError('Could not sign in. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/session', { method: 'DELETE' });
      if (response.status !== 204) throw new Error('Logout failed');
      setIdentity(undefined);
      navigate('/login');
      setScreen('login');
    } catch {
      setError('Could not sign out. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className={screen === 'signed-in' && identity?.role === 'REQUESTER' ? 'workspace-shell' : undefined} aria-labelledby="page-title">
        <p className="product">Workflow and Approval System</p>
        {screen === 'loading' && <p role="status">Checking your session…</p>}
        {screen === 'unavailable' && <>
          <h1 id="page-title" tabIndex={-1} ref={heading}>Session unavailable</h1>
          <p role="alert">Could not check your session.</p>
          <button onClick={() => { setScreen('loading'); setAttempt((value) => value + 1); }}>Try again</button>
        </>}
        {screen === 'login' && <>
          <h1 id="page-title" tabIndex={-1} ref={heading}>Sign in</h1>
          <p>Use your assigned account to open your workspace.</p>
          <form onSubmit={signIn} aria-busy={busy}>
            <label htmlFor="login">Login</label>
            <input id="login" name="login" autoComplete="username" required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </>}
        {screen === 'signed-in' && identity && <>
          {identity.role === 'REQUESTER' ? <RequestWorkspace heading={heading} /> : <h1 id="page-title" tabIndex={-1} ref={heading}>Review queue</h1>}
          <p role="status">Signed in as {identity.role === 'REQUESTER' ? 'Requester' : 'Reviewer'}.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
        </>}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
