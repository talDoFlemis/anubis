import { Module } from '@nestjs/common';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleController } from './auth-google.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AuthGoogleService],
  controllers: [AuthGoogleController],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
