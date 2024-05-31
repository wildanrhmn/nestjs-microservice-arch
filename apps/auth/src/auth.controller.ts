import { Controller, UseGuards } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  ClientProxy
} from '@nestjs/microservices';

import { SharedService } from '@app/shared';

import { AuthService } from './auth.service';
import { NewUserDTO } from './dtos/new-user.dto';
import { ExistingUserDTO } from './dtos/existing-user.dto';
import { GoogleAuthDTO } from './dtos/google-auth.dto';
import { JwtGuard } from '@app/shared';


@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sharedService: SharedService,
  ) {}

  @MessagePattern({ cmd: 'get-users' })
  async getUsers(@Ctx() context: RmqContext) {
    this.sharedService.acknowledgeMessage(context);

    return this.authService.getUsers();
  }

  @MessagePattern({ cmd: 'get-user' })
  async getUserById(
    @Ctx() context: RmqContext,
    @Payload() user: { id: string },
  ) {
    this.sharedService.acknowledgeMessage(context);

    return this.authService.getUserById(user.id);
  }

  @MessagePattern({ cmd: 'register' })
  async register(@Ctx() context: RmqContext, @Payload() newUser: NewUserDTO) {
    this.sharedService.acknowledgeMessage(context);
    return this.authService.register(newUser);
  }

  @MessagePattern({ cmd: 'verify-email' })
  async verifyEmail(@Ctx() context: RmqContext, @Payload() token: string) {
    this.sharedService.acknowledgeMessage(context);
    return this.authService.verifyEmail(token);
  }

  @MessagePattern({ cmd: 'login-email' })
  async login(
    @Ctx() context: RmqContext,
    @Payload() existingUser: ExistingUserDTO,
  ) {
    this.sharedService.acknowledgeMessage(context);

    return this.authService.login(existingUser);
  }

  @MessagePattern({ cmd: 'login-google' })
  async loginGoogle(
    @Ctx() context: RmqContext,
    @Payload() googleAuth: GoogleAuthDTO,
  ) {
    this.sharedService.acknowledgeMessage(context);
    return this.authService.loginGoogle(googleAuth);
  }

  @MessagePattern({ cmd: 'verify-jwt' })
  @UseGuards(JwtGuard)
  async verifyJwt(
    @Ctx() context: RmqContext,
    @Payload() payload: { jwt: string },
  ) {
    this.sharedService.acknowledgeMessage(context);

    return this.authService.verifyJwt(payload.jwt);
  }

  @MessagePattern({ cmd: 'decode-jwt' })
  async decodeJwt(
    @Ctx() context: RmqContext,
    @Payload() payload: { jwt: string },
  ) {
    this.sharedService.acknowledgeMessage(context);

    return this.authService.getUserFromHeader(payload.jwt);
  }

  @MessagePattern({ cmd: 'forgot-password' })
  async forgotPassword(@Ctx() context: RmqContext, @Payload() email: string) {
    this.sharedService.acknowledgeMessage(context)
    ;
    return this.authService.forgotPassword(email);
  }
  
}