import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(RegisterDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('RegisterDto', () => {
  it('accepts a valid email and password', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(errors).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    const errors = await validateDto({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(errors).toContain('email must be a valid email address');
  });

  it('rejects an oversized email', async () => {
    const longLocal = 'a'.repeat(250);
    const errors = await validateDto({
      email: `${longLocal}@example.com`,
      password: 'secret123',
    });
    expect(errors.some((e) => e.includes('email must be at most'))).toBe(true);
  });

  it('rejects a short password', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'a1',
    });
    expect(errors.some((e) => e.includes('password must be at least 8'))).toBe(
      true,
    );
  });

  it('rejects a password without letters', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(errors).toContain('password must contain at least one letter');
  });

  it('rejects a password without digits', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'abcdefgh',
    });
    expect(errors).toContain('password must contain at least one digit');
  });

  it('rejects a non-string password', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 12345678,
    });
    expect(errors).toContain('password must be a string');
  });

  it('rejects missing fields', async () => {
    const errors = await validateDto({});
    expect(errors.length).toBeGreaterThan(0);
  });
});
