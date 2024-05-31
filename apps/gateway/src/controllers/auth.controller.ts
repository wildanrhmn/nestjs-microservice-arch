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
  
  @Controller('auth')
  export class AuthController {
    constructor(
      @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    ) { }
  
    @Post('register')
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
  
    @Post('login')
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
  
    @Get('google')
    @UseGuards(GoogleOauthGuard)
    async googleAuth() {}
  
    @Get('google/callback')
    @UseGuards(GoogleOauthGuard)
    async googleAuthRedirect(@Req() req) {
      return this.authService.send(
        {
          cmd: 'login-google',
        },
        req.user
      )
    }

    @Post('verify')
    async verifyEmail(
      @Query('token') token: string,
    ) {
      return this.authService.send(
        { cmd: 'verify-email' },
        token
      )
    }

    @Post('forgot-password')
    async forgotPassword(
      @Body('email') email: string
    ) {
      return this.authService.send(
        { cmd: 'forgot-password' },
        email
      )
    }

    @Post('verify-forgot-password')
    async verifyForgotPassword(
      @Body('code') code: number,
      @Body('userId') userId: string
    ) {
      return this.authService.send(
        { cmd: 'verify-forgot-password' },
        {
          code,
          userId
        }
      )
    }
  }
  