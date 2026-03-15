import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { AdminTokenGuard } from './guards/admin-token.guard';

@ApiTags('Admin')
@UseGuards(AdminTokenGuard)
@ApiHeader({
  name: 'x-admin-token',
  description: 'Secret admin token (ADMIN_SECRET env var)',
  required: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid admin token' })
@Controller('admin')
export class AdminController {
  @Post('change-log-level')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change the runtime Pino log level' })
  @ApiNoContentResponse({ description: 'Log level updated successfully' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid log level value' })
  changeLogLevel(@Query() logLevel: ChangeLogLevelDto) {
    PinoLogger.root.level = logLevel.level;
  }
}
