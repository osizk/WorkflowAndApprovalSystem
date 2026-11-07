import type { PrismaClient, PurchaseRequest, RequestEvent } from '@prisma/client';
import type { Express, RequestHandler, Response } from 'express';
import type { AuthRequest } from './auth.js';

type Fields = Record<string, string>;

function fail(res: Response, status: number, code: string, message: string, fields?: Fields) {
  return res.status(status).json({ error: { code, message, ...(fields && { fields }) } });
}

function parsePurchase(body: unknown) {
  const fields: Fields = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { fields: { body: 'Provide a purchase request object.' } };
  }
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['title', 'purpose', 'amount'].includes(key))) {
    fields.body = 'Unexpected request fields.';
  }
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const purpose = typeof input.purpose === 'string' ? input.purpose.trim() : '';
  if ([...title].length < 3 || [...title].length > 120) fields.title = 'Enter 3 to 120 characters.';
  if ([...purpose].length < 10 || [...purpose].length > 2000) fields.purpose = 'Enter 10 to 2000 characters.';
  let amountSatang = 0;
  if (typeof input.amount === 'string' && /^\d+(?:\.\d{1,2})?$/.test(input.amount)) {
    const [whole, fraction = ''] = input.amount.split('.');
    amountSatang = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  }
  if (amountSatang < 1 || amountSatang > 100000000) {
    fields.amount = 'Enter THB 0.01 to 1,000,000.00 with at most two decimal places.';
  }
  return Object.keys(fields).length ? { fields } : { value: { title, purpose, amountSatang } };
}

function summarize(request: PurchaseRequest) {
  const whole = Math.floor(request.amountSatang / 100);
  const fraction = String(request.amountSatang % 100).padStart(2, '0');
  return {
    id: request.id, title: request.title, amount: whole + '.' + fraction, currency: 'THB',
    status: request.status, createdAt: request.createdAt,
  };
}

export function requestDetail(request: PurchaseRequest & { events: RequestEvent[] }) {
  return {
    ...summarize(request), purpose: request.purpose, requesterId: request.requesterId,
    reviewerId: request.reviewerId,
    history: request.events.map(({ id, type, actorId, createdAt, reason }) => ({ id, type, actorId, createdAt, reason })),
  };
}

export function mountRequestRoutes(app: Express, db: PrismaClient, session: RequestHandler) {
  app.get('/api/requests', session, async (req, res) => {
    const user = (req as AuthRequest).authUser!;
    const where = user.role === 'REQUESTER' ? { requesterId: user.id } : { reviewerId: user.id };
    const requests = await db.purchaseRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    res.json({ requests: requests.map(summarize) });
  });

  app.get('/api/requests/:id', session, async (req, res) => {
    const user = (req as AuthRequest).authUser!;
    const id = req.params.id;
    const notFound = () => fail(res, 404, 'NOT_FOUND', 'Request not found');
    if (typeof id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return notFound();
    const scope = user.role === 'REQUESTER' ? { requesterId: user.id } : { reviewerId: user.id };
    const request = await db.purchaseRequest.findFirst({
      where: { id, ...scope },
      include: { events: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
    });
    if (!request) return notFound();
    return res.json({ request: requestDetail(request) });
  });

  app.post('/api/requests', session, async (req, res) => {
    const user = (req as AuthRequest).authUser!;
    if (user.role !== 'REQUESTER') return fail(res, 403, 'FORBIDDEN', 'Not allowed');
    const parsed = parsePurchase(req.body);
    if (!parsed.value) return fail(res, 422, 'VALIDATION_ERROR', 'Check the request fields', parsed.fields);
    const request = await db.$transaction(async (tx) => {
      const assignment = await tx.reviewerAssignment.findUnique({
        where: { requesterId: user.id },
        include: { reviewer: { select: { role: true } } },
      });
      if (!assignment || assignment.reviewerId === user.id || assignment.reviewer.role !== 'REVIEWER') return null;
      return tx.purchaseRequest.create({
        data: {
          ...parsed.value, requesterId: user.id, reviewerId: assignment.reviewerId,
          events: { create: { actorId: user.id, type: 'SUBMITTED' } },
        },
        include: { events: true },
      });
    });
    if (!request) return fail(res, 409, 'REVIEWER_UNAVAILABLE', 'No eligible reviewer is available');
    return res.status(201).json({ request: requestDetail(request) });
  });
}
