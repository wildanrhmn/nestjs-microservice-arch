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
  
  import { AuthGuard } from '@app/shared';
  
  @Controller('users')
  export class UserController {
    constructor(
      @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    ) { }
    
    @Get()
    async getUsers() {
      return this.authService.send(
        {
          cmd: 'get-users',
        },
        {},
      );
    }
  }
  