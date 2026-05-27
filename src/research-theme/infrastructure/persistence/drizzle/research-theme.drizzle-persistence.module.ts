import { Module } from '@nestjs/common';
import { ResearchThemeRepository } from '../research-theme.repository';
import { ResearchThemeDrizzleRepository } from './research-theme.drizzle-repository';

@Module({
  providers: [
    {
      provide: ResearchThemeRepository,
      useClass: ResearchThemeDrizzleRepository,
    },
  ],
  exports: [ResearchThemeRepository],
})
export class ResearchThemeDrizzlePersistenceModule {}
