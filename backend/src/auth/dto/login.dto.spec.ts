import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(LoginDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('LoginDto', () => {
  it('accepts valid credentials', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'whatever',
    });
    expect(errors).toEqual([]);
  });

  it('does not enforce password complexity (login should not leak rules)', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'abc',
    });
    expect(errors).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    const errors = await validateDto({
      email: 'not-an-email',
      password: 'whatever',
    });
    expect(errors).toContain('email must be a valid email address');
  });

  it('rejects a non-string password', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 12345,
    });
    expect(errors).toContain('password must be a string');
  });

  it('rejects an oversized password (DoS protection)', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'a'.repeat(200),
    });
    expect(errors.some((e) => e.includes('password must be at most'))).toBe(
      true,
    );
  });
});
