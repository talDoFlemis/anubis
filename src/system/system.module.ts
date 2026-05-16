import { Module } from '@nestjs/common';
import { SystemTokenGuard } from './guards/system-token.guard';
import { SystemController } from './system.controller';

@Module({
  controllers: [SystemController],
  providers: [SystemTokenGuard],
})
export class SystemModule {}
