import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SpecificationsModule } from './specifications/specifications.module';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { cookieConfig } from './config/cookie.config';
import { envValidationSchema } from './config/env.validation';

const ONE_MINUTE_MS = 60_000;
const DEFAULT_REQUESTS_PER_MINUTE = 60;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env',
      load: [appConfig, authConfig, cookieConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: ONE_MINUTE_MS,
          limit: DEFAULT_REQUESTS_PER_MINUTE,
        },
      ],
      // E2E tests fire many requests in tight loops against a single shared
      // server; rate limiting them adds noise without security value.
      skipIf: () => process.env['NODE_ENV'] === 'test',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    SpecificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
        stopAtFirstError: false,
      }),
    },
    // Order matters: throttler runs before JWT to short-circuit floods cheaply.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(helmet(), cookieParser()).forRoutes('*');
  }
}
