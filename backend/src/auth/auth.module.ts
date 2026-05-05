import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookiesService } from './cookies.service';
import { HashingModule } from './hashing.module';
import { TokensService } from './tokens.service';

@Module({
  imports: [UsersModule, JwtModule.register({}), HashingModule],
  controllers: [AuthController],
  providers: [AuthService, TokensService, CookiesService],
  exports: [AuthService, TokensService, CookiesService, HashingModule],
})
export class AuthModule {}
