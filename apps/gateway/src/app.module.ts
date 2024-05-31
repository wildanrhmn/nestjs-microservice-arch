import { Module } from '@nestjs/common';
import { AuthController, AppController, UserController } from './controllers';
import { SharedModule } from '@app/shared';
import { GoogleStrategy } from '@app/shared';
@Module({
  imports: [
    SharedModule.registerRmq('AUTH_SERVICE', process.env.RABBITMQ_AUTH_QUEUE)
  ],
  providers: [GoogleStrategy],
  controllers: [
    AuthController,
    AppController,
    UserController
  ],
})
export class AppModule {}
