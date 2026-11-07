import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';

export async function stopBrowserServer(server) {
  if (!server?.pid || server.exitCode !== null || server.signalCode !== null) return;
  const exited = once(server, 'exit');
  server.kill();
  await exited;
}

export async function startBrowserServer(databaseUrl, previousOrigin) {
  const server = spawn(process.execPath, ['dist/server.js'], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PUBLIC_ORIGIN: previousOrigin ?? 'http://127.0.0.1',
      PORT: previousOrigin ? new URL(previousOrigin).port : '0',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const lines = createInterface({ input: server.stdout });
  try {
    const [line] = await Promise.race([
      once(lines, 'line'),
      once(server, 'exit').then(([code]) => { throw new Error(`API exited before listening: ${code}`); }),
    ]);
    const match = /^API listening on port ([1-9]\d*)$/.exec(line);
    if (!match) throw new Error('API did not report its listening port');
    const origin = `http://127.0.0.1:${match[1]}`;
    if (previousOrigin && origin !== previousOrigin) throw new Error('API restarted on a different origin');
    return { server, origin };
  } catch (error) {
    await stopBrowserServer(server);
    throw error;
  } finally {
    lines.close();
  }
}
