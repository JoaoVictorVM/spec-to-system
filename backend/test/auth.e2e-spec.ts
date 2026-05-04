import request from 'supertest';
import { TestApp } from './test-app';

interface LoginResponseBody {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; passwordHash?: string; password?: string };
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

    it('returns 200 with access token, refresh token and public user on valid credentials', async () => {
      await registerUser();

      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const body = response.body as LoginResponseBody;
      expect(body).toMatchObject({
        accessToken: expect.any(String) as string,
        refreshToken: expect.any(String) as string,
        user: {
          id: expect.any(String) as string,
          email: credentials.email,
        },
      });
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(body.user).not.toHaveProperty('password');
    });

    it('persists the refresh token hashed (never plain) in the database', async () => {
      await registerUser();

      const response = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const body = response.body as LoginResponseBody;
      const persisted = await testApp.prisma.refreshToken.findMany({});
      expect(persisted).toHaveLength(1);
      const stored = persisted[0];
      expect(stored).toBeDefined();
      expect(stored?.tokenHash).not.toBe(body.refreshToken);
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

    it('does not leak whether the email exists (same status for both failure modes)', async () => {
      await registerUser();

      const wrongPwd = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.email, password: 'wrong-pass-1' });
      const unknownEmail = await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'wrong-pass-1' });

      expect(wrongPwd.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
    });

    it('returns 400 when the email is malformed', async () => {
      await request(testApp.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'whatever' })
        .expect(400);
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
});
