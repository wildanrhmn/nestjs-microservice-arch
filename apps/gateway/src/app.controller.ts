import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { AuthGuard, UserInterceptor, UserRequest } from '@app/shared';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject('MAIL_SERVICE') private readonly mailerService: ClientProxy,
  ) {}

  @UseGuards(AuthGuard)
  @Get('')
  async hello() {
    return 'Welcome to chativo-api!';
  }

  @Get('users')
  async getUsers() {
    return this.authService.send(
      {
        cmd: 'get-users',
      },
      {},
    );
  }

  @Get('mailer')
  async getMailer() {
    return this.mailerService.send(
      {
        cmd: 'get-mailer',
      },
      {},
    );
  }

  @Post('auth/register')
  async register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone') phone: string,
  ) {
    return this.authService.send(
      {
        cmd: 'register',
      },
      {
        name,
        email,
        password,
        phone,
      },
    );
  }

  @Post('auth/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.send(
      {
        cmd: 'login',
      },
      {
        email,
        password,
      },
    );
  }
}
