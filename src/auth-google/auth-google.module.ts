import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleController } from './auth-google.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleIdTokenStrategy } from './google-id-token.strategy';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PassportModule.register({ session: false }),
  ],
  providers: [AuthGoogleService, GoogleIdTokenStrategy, GoogleAuthGuard],
  controllers: [AuthGoogleController],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
