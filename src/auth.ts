import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { PrismaClient, Role, User } from '@prisma/client';

const lifetimeMs = 8 * 60 * 60 * 1000;
type AuthRequest = Request & { authUser?: Pick<User, 'id' | 'role'> };

function error(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

function cookieToken(req: Request) {
  return req.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith('session='))?.slice(8);
}

function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function validPassword(password: string, stored: string) {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !/^[0-9a-f]{32}$/.test(parts[1]) || !/^[0-9a-f]{128}$/.test(parts[2])) return false;
  const actual = scryptSync(password, Buffer.from(parts[1], 'hex'), 64);
  return timingSafeEqual(actual, Buffer.from(parts[2], 'hex'));
}

export function requireSession(db: PrismaClient, now: () => Date = () => new Date()) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = cookieToken(req);
    if (!token) return error(res, 401, 'AUTH_REQUIRED', 'Sign in required');
    const session = await db.session.findFirst({
      where: { tokenDigest: digest(token), expiresAt: { gt: now() } },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!session) return error(res, 401, 'AUTH_REQUIRED', 'Sign in required');
    (req as AuthRequest).authUser = session.user;
    next();
  };
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as AuthRequest).authUser?.role !== role) return error(res, 403, 'FORBIDDEN', 'Not allowed');
    next();
  };
}

export function createApp(db: PrismaClient, options: { origin: string; now?: () => Date }) {
  const app = express();
  const secure = new URL(options.origin).protocol === 'https:';
  const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };
  app.use(express.json());
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('origin') !== options.origin) {
      return error(res, 403, 'FORBIDDEN', 'Invalid request origin');
    }
    next();
  });

  app.post('/api/session', async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !['login', 'password'].includes(key)) || typeof body.login !== 'string' || typeof body.password !== 'string') {
      return error(res, 422, 'VALIDATION_ERROR', 'Login and password are required');
    }
    const login = body.login.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { login } });
    if (!user || !validPassword(body.password, user.passwordHash)) return error(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { tokenDigest: digest(token), userId: user.id, expiresAt: new Date((options.now?.() ?? new Date()).getTime() + lifetimeMs) } });
    res.cookie('session', token, { ...cookieOptions, maxAge: lifetimeMs });
    return res.json({ id: user.id, role: user.role });
  });

  app.get('/api/session', requireSession(db, options.now), (req, res) => {
    const { id, role } = (req as AuthRequest).authUser!;
    res.json({ id, role });
  });

  app.delete('/api/session', async (req, res) => {
    const token = cookieToken(req);
    if (token) await db.session.deleteMany({ where: { tokenDigest: digest(token) } });
    res.clearCookie('session', cookieOptions);
    res.status(204).end();
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if ('type' in err && err.type === 'entity.parse.failed') return error(res, 400, 'BAD_REQUEST', 'Malformed JSON');
    console.error(err);
    return error(res, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  });
  return app;
}
