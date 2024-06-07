import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Delete,
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
    
    @UseGuards(AuthGuard)
    @Get()
    async getUsers() {
      return this.authService.send(
        {
          cmd: 'get-users',
        },
        {},
      );
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getUserById(@Body('id') id: string) {
      return this.authService.send(
        {
          cmd: 'get-user',
        },
        id,
      );
    }

    @UseGuards(AuthGuard)
    @Post('update-profile')
    async updateProfile(@Req() req: any, @Body() body: any) {
      return this.authService.send(
        {
          cmd: 'update-profile',
        },
        {
          ...body,
          userId: req.user.id
        },
      );
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    async deleteUser(@Body('id') id: string) {
      return this.authService.send(
        {
          cmd: 'delete-user',
        },
        id,
      );
    }
  }
  