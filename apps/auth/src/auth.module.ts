import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SharedModule, PostgresDBModule, UserEntity, TokenResetEntity, SharedService } from '@app/shared';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy, JwtGuard, GoogleStrategy } from '@app/shared';
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '3600s' },
      }),
      inject: [ConfigService],
    }),
    SharedModule.registerRmq('MAIL_SERVICE', process.env.RABBITMQ_MAIL_QUEUE),
    PostgresDBModule,

    TypeOrmModule.forFeature([
      UserEntity, TokenResetEntity
    ]),
  ],
  controllers: [AuthController],
  providers: [
    JwtGuard,
    JwtStrategy,
    GoogleStrategy,
    AuthService,
    SharedService,
  ],
})
export class AuthModule { }
