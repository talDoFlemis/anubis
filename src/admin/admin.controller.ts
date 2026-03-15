import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChangeLogLevelDto } from './dto/change-log-level.dto';
import { PinoLogger } from 'nestjs-pino';
import { AdminTokenGuard } from './guards/admin-token.guard';

@Controller('admin')
@UseGuards(AdminTokenGuard)
export class AdminController {
  @Post('change-log-level')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeLogLevel(@Query() logLevel: ChangeLogLevelDto) {
    PinoLogger.root.level = logLevel.level;
  }
}
