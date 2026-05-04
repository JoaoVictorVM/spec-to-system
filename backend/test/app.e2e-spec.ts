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
});
