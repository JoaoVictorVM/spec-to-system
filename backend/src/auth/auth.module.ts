import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookiesService } from './cookies.service';
import { HashingService } from './hashing.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, HashingService, TokensService, CookiesService],
  exports: [AuthService, HashingService, TokensService, CookiesService],
})
export class AuthModule {}
