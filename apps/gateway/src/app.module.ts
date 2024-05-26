import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SharedModule } from '@app/shared';
import { GoogleStrategy } from '@app/shared';
@Module({
  imports: [
    SharedModule.registerRmq('AUTH_SERVICE', process.env.RABBITMQ_AUTH_QUEUE)
  ],
  providers: [GoogleStrategy],
  controllers: [AppController],
})
export class AppModule {}
