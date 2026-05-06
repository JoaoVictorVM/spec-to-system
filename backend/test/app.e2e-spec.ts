import request from 'supertest';
import { TestApp } from './test-app';

describe('AppController (e2e)', () => {
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

  it('GET / returns 200 with greeting', async () => {
    const response = await request(testApp.getHttpServer())
      .get('/')
      .expect(200);
    expect(response.text).toBe('Hello World!');
  });

  describe('Helmet security headers', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const response = await request(testApp.getHttpServer())
        .get('/')
        .expect(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options to deny clickjacking', async () => {
      const response = await request(testApp.getHttpServer())
        .get('/')
        .expect(200);
      expect(response.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
    });

    it('sets Strict-Transport-Security', async () => {
      const response = await request(testApp.getHttpServer())
        .get('/')
        .expect(200);
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('removes the X-Powered-By header', async () => {
      const response = await request(testApp.getHttpServer())
        .get('/')
        .expect(200);
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});
