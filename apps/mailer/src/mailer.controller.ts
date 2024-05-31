import { Controller, Inject } from '@nestjs/common';
import { SharedService } from '@app/shared';
import { MailService } from './mailer.service';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConfirmEmailDTO } from './dtos/confirm-email.dto';
import { SendVerificationEmailDTO } from './dtos/send-verification.dto';
@Controller()
export class MailerController {
  constructor(
    @Inject('MailerServiceInterface')
    private readonly mailerService: MailService,
    @Inject('SharedServiceInterface')
    private readonly sharedService: SharedService,
  ) { }

  @MessagePattern({ cmd: 'send-email' })
  async sendEmail(@Ctx() context: RmqContext, @Payload() data: ConfirmEmailDTO) {
      this.sharedService.acknowledgeMessage(context);
      return this.mailerService.sendEmail(data);
  }

  @MessagePattern({ cmd: 'send-verification-code' })
  async sendVerificationCode(@Ctx() context: RmqContext, @Payload() data: SendVerificationEmailDTO) {
    this.sharedService.acknowledgeMessage(context);
    return this.mailerService.sendVerificationEmail(data);
  }
}
