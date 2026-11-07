import express from 'express';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createApp } from './auth.js';

const origin = process.env.PUBLIC_ORIGIN;
if (!origin) throw new Error('PUBLIC_ORIGIN is required');
const db = new PrismaClient();
const port = Number(process.env.PORT || 3000);
const dynamicPort = port === 0;
if (dynamicPort && origin !== 'http://127.0.0.1') {
  throw new Error('PORT=0 requires PUBLIC_ORIGIN=http://127.0.0.1');
}
const options = { origin };
const app = createApp(db, options);
const webRoot = resolve('client-dist');

app.use('/assets', express.static(resolve(webRoot, 'assets')));
app.get(['/', '/login', '/requests', '/requests/new', '/requests/:id', '/reviews', '/reviews/:id'], (_req, res) => {
  res.sendFile('index.html', { root: webRoot });
});
function onListen(error?: Error) {
  if (error) throw error;
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  if (dynamicPort) options.origin = `http://127.0.0.1:${address.port}`;
  console.log(`API listening on port ${address.port}`);
}

const server = dynamicPort ? app.listen(port, '127.0.0.1', onListen) : app.listen(port, onListen);
