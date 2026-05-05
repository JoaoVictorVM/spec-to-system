import request from 'supertest';
import { TestApp } from './test-app';

interface SessionResponseBody {
  user: { id: string; email: string; passwordHash?: string; password?: string };
}

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

function getSetCookieHeaders(
  headers: Record<string, string | string[] | undefined>,
): string[] {
  const value = headers['set-cookie'];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

function findCookie(setCookies: string[], name: string): string | undefined {
  return setCookies.find((c) => c.startsWith(`${name}=`));
}

function extractCookieValue(setCookies: string[], name: string): string | null {
  const cookie = findCookie(setCookies, name);
  if (!cookie) return null;
  const head = cookie.split(';')[0];
  if (!head) return null;
  const value = head.slice(name.length + 1);
  return value.length > 0 ? value : null;
}

describe('Auth (e2e)', () => {
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

  describe('POST /auth/register', () => {
    const validPayload = {
      email: 'newuser@example.com',
      password: 'secret123',
    };

    it('creates the user and returns 201 with the public user shape', async () => {
      const response = await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String) as string,
        email: 'newuser@example.com',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');
    });

    it('persists the user with a bcrypt-hashed password (never plain text)', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(201);

      const persisted = await testApp.prisma.user.findUnique({
        where: { email: validPayload.email },
      });
      expect(persisted).not.toBeNull();
      expect(persisted?.passwordHash).not.toBe(validPayload.password);
      expect(persisted?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('lowercases the email on storage', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send({ email: 'MIXEDcase@Example.com', password: 'secret123' })
        .expect(201);

      const persisted = await testApp.prisma.user.findUnique({
        where: { email: 'mixedcase@example.com' },
      });
      expect(persisted).not.toBeNull();
    });

    it('returns 409 when the email is already registered', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(201);

      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(409);
    });

    it('returns 400 when the email is invalid', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'secret123' })
        .expect(400);
    });

    it('returns 400 when the password is too weak', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send({ email: 'weak@example.com', password: 'short' })
        .expect(400);
    });

    it('returns 400 and rejects unknown fields (mass-assignment defense)', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send({ ...validPayload, isAdmin: true })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const credentials = {
      email: 'logintest@example.com',
      password: 'secret123',
    };

    async function registerUser(): Promise<void> {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(201);
    }

    it('returns 200 with public user only (no tokens in body)', async () => {
      await registerUser();

      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const body = response.body as SessionResponseBody;
      expect(body.user.email).toBe(credentials.email);
      expect(body).not.toHaveProperty('accessToken');
      expect(body).not.toHaveProperty('refreshToken');
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('sets HttpOnly access and refresh cookies', async () => {
      await registerUser();

      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const setCookies = getSetCookieHeaders(response.headers);
      const access = findCookie(setCookies, ACCESS_COOKIE);
      const refresh = findCookie(setCookies, REFRESH_COOKIE);

      expect(access).toBeDefined();
      expect(refresh).toBeDefined();
      expect(access).toMatch(/HttpOnly/i);
      expect(refresh).toMatch(/HttpOnly/i);
      expect(access).toMatch(/Path=\//);
      expect(refresh).toMatch(/Path=\/auth/);
    });

    it('persists the refresh token hashed (never plain) in the database', async () => {
      await registerUser();

      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const setCookies = getSetCookieHeaders(response.headers);
      const plainRefresh = extractCookieValue(setCookies, REFRESH_COOKIE);
      expect(plainRefresh).not.toBeNull();

      const persisted = await testApp.prisma.refreshToken.findMany({});
      expect(persisted).toHaveLength(1);
      const stored = persisted[0];
      expect(stored?.tokenHash).not.toBe(plainRefresh);
      expect(stored?.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(stored?.revokedAt).toBeNull();
    });

    it('returns 401 for an unknown email', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({ email: 'never-registered@example.com', password: 'secret123' })
        .expect(401);
    });

    it('returns 401 for a wrong password', async () => {
      await registerUser();

      await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.email, password: 'wrong-pass-1' })
        .expect(401);
    });

    it('logs in case-insensitively on email', async () => {
      await registerUser();

      await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({
          email: credentials.email.toUpperCase(),
          password: credentials.password,
        })
        .expect(200);
    });
  });

  describe('POST /auth/refresh', () => {
    const credentials = {
      email: 'refreshuser@example.com',
      password: 'secret123',
    };

    async function loginAndGetCookies(): Promise<string[]> {
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(201);
      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);
      return getSetCookieHeaders(response.headers);
    }

    it('returns 200 with rotated cookies and the public user', async () => {
      const cookies = await loginAndGetCookies();

      const response = await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as SessionResponseBody;
      expect(body.user.email).toBe(credentials.email);

      const newCookies = getSetCookieHeaders(response.headers);
      expect(findCookie(newCookies, ACCESS_COOKIE)).toBeDefined();
      expect(findCookie(newCookies, REFRESH_COOKIE)).toBeDefined();

      const oldRefresh = extractCookieValue(cookies, REFRESH_COOKIE);
      const newRefresh = extractCookieValue(newCookies, REFRESH_COOKIE);
      expect(newRefresh).not.toBe(oldRefresh);
    });

    it('revokes the old refresh token in the database after rotation', async () => {
      const cookies = await loginAndGetCookies();
      const oldRefresh = extractCookieValue(cookies, REFRESH_COOKIE);
      expect(oldRefresh).not.toBeNull();

      await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const tokens = await testApp.prisma.refreshToken.findMany({
        orderBy: { createdAt: 'asc' },
      });
      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.revokedAt).not.toBeNull();
      expect(tokens[1]?.revokedAt).toBeNull();
    });

    it('rejects reuse of a refresh token that has already been rotated (replay defense)', async () => {
      const cookies = await loginAndGetCookies();

      await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });

    it('returns 401 when the refresh cookie is missing', async () => {
      await request(testApp.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('returns 401 when the refresh cookie value is unknown', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_COOKIE}=this-is-not-a-real-token`)
        .expect(401);
    });

    it('clears the auth cookies on a failed refresh', async () => {
      const response = await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_COOKIE}=invalid`)
        .expect(401);

      const setCookies = getSetCookieHeaders(response.headers);
      const access = findCookie(setCookies, ACCESS_COOKIE);
      const refresh = findCookie(setCookies, REFRESH_COOKIE);
      expect(access).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
      expect(refresh).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
    });
  });
});
