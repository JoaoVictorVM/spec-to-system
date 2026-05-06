import request from 'supertest';
import { TestApp } from './test-app';

interface SpecBody {
  id: string;
  sessionCode: string;
  prompt: string;
  response: string;
  userId: string | null;
  createdAt: string;
}

function getSetCookieHeaders(
  headers: Record<string, string | string[] | undefined>,
): string[] {
  const value = headers['set-cookie'];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

describe('Specifications (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await TestApp.create();
  });

  beforeEach(async () => {
    await testApp.resetDatabase();
  });

  afterAll(async () => {
    await testApp.close();
  });

  const credentials = { email: 'specuser@example.com', password: 'secret123' };

  async function loginAndGetCookies(
    creds: { email: string; password: string } = credentials,
  ): Promise<string[]> {
    await request(testApp.getHttpServer())
      .post('/auth/register')
      .send(creds)
      .expect(201);
    const response = await request(testApp.getHttpServer())
      .post('/auth/login')
      .send(creds)
      .expect(200);
    return getSetCookieHeaders(response.headers);
  }

  const validPayload = {
    sessionCode: 'aB3_-x',
    prompt: 'Build a real-time chat app for small teams',
    response: '## Visão Geral\nUse Next.js + Postgres + Prisma.',
  };

  describe('POST /specifications', () => {
    it('returns 401 without access cookie (auth required)', async () => {
      await request(testApp.getHttpServer())
        .post('/specifications')
        .send(validPayload)
        .expect(401);
    });

    it('creates the specification and returns 201 with the persisted shape', async () => {
      const cookies = await loginAndGetCookies();

      const response = await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send(validPayload)
        .expect(201);

      const body = response.body as SpecBody;
      expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(body.sessionCode).toBe(validPayload.sessionCode);
      expect(body.prompt).toBe(validPayload.prompt);
      expect(body.response).toBe(validPayload.response);
      expect(body.userId).not.toBeNull();
      expect(typeof body.createdAt).toBe('string');
    });

    it('persists with the authenticated user as owner', async () => {
      const cookies = await loginAndGetCookies();

      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send(validPayload)
        .expect(201);

      const persisted = await testApp.prisma.specification.findUnique({
        where: { sessionCode: validPayload.sessionCode },
      });
      expect(persisted).not.toBeNull();
      const user = await testApp.prisma.user.findUnique({
        where: { email: credentials.email },
      });
      expect(persisted?.userId).toBe(user?.id);
    });

    it('returns 409 on a duplicate sessionCode', async () => {
      const cookies = await loginAndGetCookies();

      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send(validPayload)
        .expect(201);

      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send(validPayload)
        .expect(409);
    });

    it('returns 400 when sessionCode has wrong length', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send({ ...validPayload, sessionCode: 'abc' })
        .expect(400);
    });

    it('returns 400 when sessionCode contains invalid characters', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send({ ...validPayload, sessionCode: 'abc/de' })
        .expect(400);
    });

    it('returns 400 with an empty prompt', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send({ ...validPayload, prompt: '' })
        .expect(400);
    });

    it('returns 400 with an empty response', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send({ ...validPayload, response: '' })
        .expect(400);
    });

    it('rejects unknown fields (mass-assignment defense)', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .post('/specifications')
        .set('Cookie', cookies)
        .send({ ...validPayload, userId: 'someone-else' })
        .expect(400);
    });
  });
});
