import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '../env.validation';
import { AdminController } from './admin.controller';
import { AdminTokenGuard } from './guards/admin-token.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
  controllers: [AdminController],
  providers: [AdminTokenGuard],
})
export class AdminModule {}
