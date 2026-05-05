import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(UpdateUserDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('UpdateUserDto', () => {
  it('accepts email-only updates', async () => {
    const errors = await validateDto({ email: 'new@example.com' });
    expect(errors).toEqual([]);
  });

  it('accepts password-only updates', async () => {
    const errors = await validateDto({ password: 'newpass123' });
    expect(errors).toEqual([]);
  });

  it('accepts both email and password', async () => {
    const errors = await validateDto({
      email: 'new@example.com',
      password: 'newpass123',
    });
    expect(errors).toEqual([]);
  });

  it('rejects empty payloads', async () => {
    const errors = await validateDto({});
    expect(errors).toContain(
      'at least one of "email" or "password" must be provided',
    );
  });

  it('rejects an invalid email when provided', async () => {
    const errors = await validateDto({ email: 'not-an-email' });
    expect(errors).toContain('email must be a valid email address');
  });

  it('rejects a weak password when provided', async () => {
    const errors = await validateDto({ password: 'short' });
    expect(errors.some((e) => e.includes('password must be at least 8'))).toBe(
      true,
    );
  });

  it('rejects a password without letters when provided', async () => {
    const errors = await validateDto({ password: '12345678' });
    expect(errors).toContain('password must contain at least one letter');
  });

  it('rejects a password without digits when provided', async () => {
    const errors = await validateDto({ password: 'abcdefgh' });
    expect(errors).toContain('password must contain at least one digit');
  });
});
