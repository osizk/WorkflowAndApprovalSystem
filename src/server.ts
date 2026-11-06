import { PrismaClient } from '@prisma/client';
import { createApp } from './auth.js';

const origin = process.env.PUBLIC_ORIGIN;
if (!origin) throw new Error('PUBLIC_ORIGIN is required');
const db = new PrismaClient();
const port = Number(process.env.PORT || 3000);
createApp(db, { origin }).listen(port, () => console.log(`API listening on port ${port}`));
