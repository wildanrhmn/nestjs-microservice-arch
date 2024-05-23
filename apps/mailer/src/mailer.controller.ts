import { Controller, Inject } from '@nestjs/common';
import { SharedService } from '@app/shared';
import { MailService } from './mailer.service';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConfirmEmailDTO } from './dtos/confirm-email.dto';
@Controller()
export class MailerController {
  constructor(
    private readonly mailerService: MailService,
    @Inject('SharedServiceInterface')
    private readonly sharedService: SharedService,
  ) { }

  @MessagePattern({ cmd: 'get-mailer' })
  async getMailer() {
    console.log('mailer')
    return 'mailer';
  }

  @MessagePattern({ cmd: 'send-email' })
  async sendEmail(@Ctx() context: RmqContext, @Payload() data: ConfirmEmailDTO) {
    console.info(data)
      this.sharedService.acknowledgeMessage(context);
      return this.mailerService.sendEmail(data.user, data.token);

  }
}
