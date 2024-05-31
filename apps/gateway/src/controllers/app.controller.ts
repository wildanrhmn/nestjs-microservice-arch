import {
  Controller,
  Get
} from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
  ) { }

  @Get('')
  async hello() {
    return 'Welcome to chativo-api!';
  }
}
