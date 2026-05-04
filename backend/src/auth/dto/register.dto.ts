import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const EMAIL_MAX = 254;

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(EMAIL_MAX, {
    message: `email must be at most ${EMAIL_MAX} characters long`,
  })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(PASSWORD_MIN, {
    message: `password must be at least ${PASSWORD_MIN} characters long`,
  })
  @MaxLength(PASSWORD_MAX, {
    message: `password must be at most ${PASSWORD_MAX} characters long`,
  })
  @Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' })
  @Matches(/\d/, { message: 'password must contain at least one digit' })
  password!: string;
}
