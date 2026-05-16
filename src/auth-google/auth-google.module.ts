import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AuthGoogleController } from './auth-google.controller';
import { AuthGoogleService } from './auth-google.service';
import { GoogleIdTokenStrategy } from './google-id-token.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [AuthGoogleService, GoogleIdTokenStrategy, GoogleAuthGuard],
  controllers: [AuthGoogleController],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
