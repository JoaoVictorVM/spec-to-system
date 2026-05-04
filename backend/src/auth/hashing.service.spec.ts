import { HashingService } from './hashing.service';

describe('HashingService', () => {
  const service = new HashingService();

  it('produces a hash that differs from the plain text', async () => {
    const hash = await service.hash('my-password-123');
    expect(hash).not.toBe('my-password-123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces a bcrypt-formatted hash', async () => {
    const hash = await service.hash('my-password-123');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const a = await service.hash('same-password-123');
    const b = await service.hash('same-password-123');
    expect(a).not.toBe(b);
  });

  it('compare returns true for the matching plain text', async () => {
    const hash = await service.hash('my-password-123');
    await expect(service.compare('my-password-123', hash)).resolves.toBe(true);
  });

  it('compare returns false for a mismatched plain text', async () => {
    const hash = await service.hash('my-password-123');
    await expect(service.compare('wrong-password', hash)).resolves.toBe(false);
  });

  it('uses cost factor of at least 12 (per PRD security requirements)', async () => {
    const hash = await service.hash('any-password-123');
    const cost = Number(hash.split('$')[2]);
    expect(cost).toBeGreaterThanOrEqual(12);
  });
});
