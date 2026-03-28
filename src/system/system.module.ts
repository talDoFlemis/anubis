import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemTokenGuard } from './guards/system-token.guard';

@Module({
  controllers: [SystemController],
  providers: [SystemTokenGuard],
})
export class SystemModule {}
