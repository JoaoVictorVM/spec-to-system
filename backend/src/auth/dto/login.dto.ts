import { IsEmail, IsString, MaxLength } from 'class-validator';

const PASSWORD_MAX = 128;
const EMAIL_MAX = 254;

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(EMAIL_MAX, {
    message: `email must be at most ${EMAIL_MAX} characters long`,
  })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MaxLength(PASSWORD_MAX, {
    message: `password must be at most ${PASSWORD_MAX} characters long`,
  })
  password!: string;
}
