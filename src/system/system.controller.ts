import { Controller, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ChangeLogLevelDto } from './dto/change-log-level.dto';
import { PinoLogger } from 'nestjs-pino';
import { SystemTokenGuard } from './guards/system-token.guard';

@ApiTags('System')
@UseGuards(SystemTokenGuard)
@ApiHeader({
  name: 'x-system-token',
  description: 'Secret system token (SYSTEM_SECRET env var)',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid system token' })
@Controller('system')
export class SystemController {
  @Post('change-log-level')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change the runtime Pino log level' })
  @ApiNoContentResponse({ description: 'Log level updated successfully' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid log level value' })
  changeLogLevel(@Query() logLevel: ChangeLogLevelDto) {
    PinoLogger.root.level = logLevel.level;
  }
}
