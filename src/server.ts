import express from 'express';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createApp } from './auth.js';

const origin = process.env.PUBLIC_ORIGIN;
if (!origin) throw new Error('PUBLIC_ORIGIN is required');
const db = new PrismaClient();
const port = Number(process.env.PORT || 3000);
const app = createApp(db, { origin });
const webRoot = resolve('client-dist');

app.use('/assets', express.static(resolve(webRoot, 'assets')));
app.get(['/', '/login', '/requests', '/reviews'], (_req, res) => {
  res.sendFile('index.html', { root: webRoot });
});
app.listen(port, () => console.log(`API listening on port ${port}`));
