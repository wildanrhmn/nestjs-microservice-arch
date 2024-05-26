import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { AuthGuard, GoogleOauthGuard } from '@app/shared';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) { }

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

  @Post('auth/verify')
  async verifyEmail(
    @Query('token') token: string,
  ) {
    return this.authService.send(
      { cmd: 'verify-email' },
      token
    )
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
        cmd: 'login-email',
      },
      {
        email,
        password,
      },
    );
  }

  @Get('auth/google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  @Get('auth/google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req) {
    return this.authService.send(
      {
        cmd: 'login-google',
      },
      req.user
    )
  }
}
