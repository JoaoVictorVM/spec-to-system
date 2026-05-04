import request from 'supertest';
import { TestApp } from './test-app';

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
});
