import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ChangeLogLevelDto } from './dto/change-log-level.dto';
import { PinoLogger } from 'nestjs-pino';

@Controller('admin')
export class AdminController {
  @Post('change-log-level')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeLogLevel(@Query() logLevel: ChangeLogLevelDto) {
    PinoLogger.root.level = logLevel.level;
  }
}
