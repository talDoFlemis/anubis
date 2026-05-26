import { SessionAuthGuard } from '@/auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '@/auth/guards/session-lifecycle.guard';
import { RolesGuard } from '@/roles/roles.guard';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResearchThemeDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/research-theme.drizzle-persistence.module';
import { ResearchThemeController } from './research-theme.controller';
import { ResearchThemeService } from './research-theme.service';

@Module({
  imports: [ResearchThemeDrizzlePersistenceModule, UsersModule],
  controllers: [ResearchThemeController],
  providers: [ResearchThemeService, SessionAuthGuard, SessionLifecycleGuard, RolesGuard, Reflector],
  exports: [ResearchThemeService],
})
export class ResearchThemeModule {}
