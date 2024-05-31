import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfirmEmailDTO } from './dtos/confirm-email.dto';
import { SendVerificationEmailDTO } from './dtos/send-verification.dto';
@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService
  ) { }
  async sendEmail(data: ConfirmEmailDTO) {
    const url = `http://localhost:4000/auth/verify?token=${data.token}`;

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

  async sendVerificationEmail(data: SendVerificationEmailDTO) {
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Please verify yourself - Chativo',
      template: 'email-verification-code',
      context: {
        name: data.name,
        code: data.code
      }
    })

    return {
      message: 'Verification code sent to your email'
    }
  }
}
