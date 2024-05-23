import { Module } from '@nestjs/common';
import { MailerController } from './mailer.controller';
import { MailService } from './mailer.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'; 
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { SharedModule, SharedService } from '@app/shared';
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          secure: configService.get('SMTP_SECURE'),
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get('SMTP_FROM'),
        },
        template: {
          dir: join(__dirname, './templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
      },
      }),
    }),
    SharedModule
  ],
  controllers: [MailerController],
  providers: [
    MailService,
    {
      provide: 'SharedServiceInterface',
      useClass: SharedService,
    },
  ],
})
export class MailModule {}
