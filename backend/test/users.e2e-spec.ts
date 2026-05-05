import request from 'supertest';
import { TestApp } from './test-app';

interface PublicUserBody {
  id: string;
  email: string;
  passwordHash?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
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

describe('Users (e2e)', () => {
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

  const credentials = { email: 'meuser@example.com', password: 'secret123' };

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

  describe('GET /users/me', () => {
    it('returns 401 when no access cookie is sent (guard active)', async () => {
      await request(testApp.getHttpServer()).get('/users/me').expect(401);
    });

    it('returns 401 when only the refresh cookie is sent', async () => {
      const cookies = await loginAndGetCookies();
      const refreshOnly = cookies.filter((c) =>
        c.startsWith(`${REFRESH_COOKIE}=`),
      );
      await request(testApp.getHttpServer())
        .get('/users/me')
        .set('Cookie', refreshOnly)
        .expect(401);
    });

    it('returns 401 with an invalid access token', async () => {
      await request(testApp.getHttpServer())
        .get('/users/me')
        .set('Cookie', `${ACCESS_COOKIE}=this-is-not-a-real-jwt`)
        .expect(401);
    });

    it('returns 200 with the public user when authenticated', async () => {
      const cookies = await loginAndGetCookies();

      const response = await request(testApp.getHttpServer())
        .get('/users/me')
        .set('Cookie', cookies)
        .expect(200);

      const body = response.body as PublicUserBody;
      expect(body.email).toBe(credentials.email);
      expect(body).not.toHaveProperty('passwordHash');
      expect(body).not.toHaveProperty('password');
    });
  });

  describe('PATCH /users/me', () => {
    it('returns 401 without access cookie', async () => {
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .send({ email: 'changed@example.com' })
        .expect(401);
    });

    it('updates the email and returns the public user', async () => {
      const cookies = await loginAndGetCookies();

      const response = await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ email: 'updated@example.com' })
        .expect(200);

      const body = response.body as PublicUserBody;
      expect(body.email).toBe('updated@example.com');
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('rejects 400 when payload is empty', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({})
        .expect(400);
    });

    it('rejects 400 when email is malformed', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('rejects 400 when password is too weak', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ password: 'weak' })
        .expect(400);
    });

    it('returns 409 when the new email is already taken', async () => {
      // Register a second user first
      await request(testApp.getHttpServer())
        .post('/auth/register')
        .send({ email: 'taken@example.com', password: 'secret123' })
        .expect(201);

      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ email: 'taken@example.com' })
        .expect(409);
    });

    it('persists a bcrypt hash for the new password (never plain text)', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ password: 'brandnew123' })
        .expect(200);

      const persisted = await testApp.prisma.user.findUnique({
        where: { email: credentials.email },
      });
      expect(persisted?.passwordHash).not.toBe('brandnew123');
      expect(persisted?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('rejects unknown fields (mass-assignment defense)', async () => {
      const cookies = await loginAndGetCookies();
      await request(testApp.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookies)
        .send({ email: 'ok@example.com', isAdmin: true })
        .expect(400);
    });
  });

  describe('DELETE /users/me', () => {
    it('returns 401 without access cookie', async () => {
      await request(testApp.getHttpServer()).delete('/users/me').expect(401);
    });

    it('deletes the user and cascades refresh tokens', async () => {
      const cookies = await loginAndGetCookies();

      await request(testApp.getHttpServer())
        .delete('/users/me')
        .set('Cookie', cookies)
        .expect(204);

      const userAfter = await testApp.prisma.user.findUnique({
        where: { email: credentials.email },
      });
      expect(userAfter).toBeNull();

      const tokensAfter = await testApp.prisma.refreshToken.findMany({});
      expect(tokensAfter).toHaveLength(0);
    });

    it('subsequent /auth/refresh fails after the user is deleted', async () => {
      const cookies = await loginAndGetCookies();

      await request(testApp.getHttpServer())
        .delete('/users/me')
        .set('Cookie', cookies)
        .expect(204);

      await request(testApp.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});
