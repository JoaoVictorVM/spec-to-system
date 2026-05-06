import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListSpecificationsQueryDto } from './list-specifications-query.dto';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(ListSpecificationsQueryDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('ListSpecificationsQueryDto', () => {
  it('accepts an empty query (defaults applied at service layer)', async () => {
    expect(await validateDto({})).toEqual([]);
  });

  it('accepts a valid uuid cursor and a limit string (transformed to number)', async () => {
    expect(
      await validateDto({
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: '50',
      }),
    ).toEqual([]);
  });

  it('rejects a non-uuid cursor', async () => {
    const errors = await validateDto({ cursor: 'not-a-uuid' });
    expect(errors).toContain('cursor must be a valid UUID');
  });

  it('rejects a non-integer limit', async () => {
    const errors = await validateDto({ limit: '1.5' });
    expect(errors).toContain('limit must be an integer');
  });

  it('rejects a limit below 1', async () => {
    const errors = await validateDto({ limit: '0' });
    expect(errors).toContain('limit must be at least 1');
  });

  it('rejects a limit above the maximum', async () => {
    const errors = await validateDto({ limit: '101' });
    expect(errors).toContain('limit must be at most 100');
  });
});
