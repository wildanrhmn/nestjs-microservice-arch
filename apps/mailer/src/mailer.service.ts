import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfirmEmailDTO } from './dtos/confirm-email.dto';
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendEmail(data: ConfirmEmailDTO) {
    const url = `http://localhost:4000/auth/confirm?token=${data.token}`;
    
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Please confirm your email - Chativo',
      template: 'email-confirmation',
      context: {
        name: data.name,
        url
      },
    });
  }
}
