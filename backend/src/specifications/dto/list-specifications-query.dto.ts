import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 100;

export class ListSpecificationsQueryDto {
  @IsOptional()
  @IsString({ message: 'cursor must be a string' })
  @IsUUID('4', { message: 'cursor must be a valid UUID' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(MAX_LIST_LIMIT, { message: `limit must be at most ${MAX_LIST_LIMIT}` })
  limit?: number;
}
