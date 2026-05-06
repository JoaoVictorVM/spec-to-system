import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSpecificationDto } from './create-specification.dto';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(CreateSpecificationDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('CreateSpecificationDto', () => {
  const valid = {
    sessionCode: 'aB3_-x',
    prompt: 'Build a chat app',
    response: '## Visão Geral\n\nUse Next.js + Postgres.',
  };

  it('accepts a fully valid payload', async () => {
    expect(await validateDto(valid)).toEqual([]);
  });

  it('accepts URL-safe characters in the sessionCode (A-Za-z0-9_-)', async () => {
    expect(await validateDto({ ...valid, sessionCode: 'aZ0_9-' })).toEqual([]);
  });

  it('rejects a sessionCode shorter than 6 characters', async () => {
    const errors = await validateDto({ ...valid, sessionCode: 'abc' });
    expect(errors.some((e) => e.includes('exactly 6'))).toBe(true);
  });

  it('rejects a sessionCode longer than 6 characters', async () => {
    const errors = await validateDto({ ...valid, sessionCode: 'abcdefg' });
    expect(errors.some((e) => e.includes('exactly 6'))).toBe(true);
  });

  it('rejects a sessionCode with non-URL-safe characters', async () => {
    const errors = await validateDto({ ...valid, sessionCode: 'abc/de' });
    expect(errors.some((e) => e.includes('URL-safe'))).toBe(true);
  });

  it('rejects an empty prompt', async () => {
    const errors = await validateDto({ ...valid, prompt: '' });
    expect(errors).toContain('prompt must not be empty');
  });

  it('rejects an empty response', async () => {
    const errors = await validateDto({ ...valid, response: '' });
    expect(errors).toContain('response must not be empty');
  });

  it('rejects an oversized prompt', async () => {
    const errors = await validateDto({ ...valid, prompt: 'a'.repeat(20_000) });
    expect(errors.some((e) => e.includes('prompt must be at most'))).toBe(true);
  });

  it('rejects an oversized response', async () => {
    const errors = await validateDto({
      ...valid,
      response: 'a'.repeat(300_000),
    });
    expect(errors.some((e) => e.includes('response must be at most'))).toBe(
      true,
    );
  });

  it('rejects non-string fields', async () => {
    const errors = await validateDto({
      sessionCode: 123456,
      prompt: { x: 1 },
      response: ['array'],
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
