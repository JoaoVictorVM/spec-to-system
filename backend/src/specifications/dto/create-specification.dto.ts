import {
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const SESSION_CODE_LENGTH = 6;
const SESSION_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
const PROMPT_MIN = 1;
const PROMPT_MAX = 10_000;
const RESPONSE_MIN = 1;
const RESPONSE_MAX = 200_000;

export class CreateSpecificationDto {
  @IsString({ message: 'sessionCode must be a string' })
  @Length(SESSION_CODE_LENGTH, SESSION_CODE_LENGTH, {
    message: `sessionCode must be exactly ${SESSION_CODE_LENGTH} characters long`,
  })
  @Matches(SESSION_CODE_PATTERN, {
    message:
      'sessionCode must contain only URL-safe characters (A-Z, a-z, 0-9, _, -)',
  })
  sessionCode!: string;

  @IsString({ message: 'prompt must be a string' })
  @MinLength(PROMPT_MIN, { message: 'prompt must not be empty' })
  @MaxLength(PROMPT_MAX, {
    message: `prompt must be at most ${PROMPT_MAX} characters long`,
  })
  prompt!: string;

  @IsString({ message: 'response must be a string' })
  @MinLength(RESPONSE_MIN, { message: 'response must not be empty' })
  @MaxLength(RESPONSE_MAX, {
    message: `response must be at most ${RESPONSE_MAX} characters long`,
  })
  response!: string;
}
