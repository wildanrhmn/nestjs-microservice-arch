import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserEntity } from '@app/shared';
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendEmail(user: UserEntity, token: string) {
    const url = `http://localhost:4000/auth/confirm?token=${token}`;
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Please confirm your email - Chativo',
      template: '/email-confirmation',
      context: {
        name: user.name,
        url
      },
    });
  }
}
