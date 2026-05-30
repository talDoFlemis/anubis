import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { PaginatedResult } from '../common/dto/paginated-response.dto';
import { StaffOnly } from '../roles/roles.decorator';
import { User } from '../users/domain/user';
import { CandidateService } from './candidate.service';
import { CandidateResponseDto, PaginatedCandidateResponseDto } from './dto/candidate-response.dto';
import { FindCandidatesDto } from './dto/find-candidates.dto';

@ApiTags('Candidates')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, SessionLifecycleGuard)
@Controller({ path: 'candidates', version: '1' })
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated candidate profile' })
  @ApiOkResponse({ type: CandidateResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({
    description: 'Only candidates can access this route',
  })
  @ApiNotFoundResponse({ description: 'Candidate profile not found' })
  getMine(@CurrentUser() user: User): Promise<CandidateResponseDto> {
    return this.candidateService.findMine(user.id);
  }

  @Get(':userId')
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a candidate profile by user id' })
  @ApiOkResponse({ type: CandidateResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Candidate profile not found' })
  findOne(@Param('userId', new ParseUUIDPipe()) userId: string): Promise<CandidateResponseDto> {
    return this.candidateService.findOneById(userId);
  }

  @Get()
  @StaffOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List candidates using optional filters' })
  @ApiOkResponse({ type: PaginatedCandidateResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  findAll(@Query() filters: FindCandidatesDto): Promise<PaginatedResult<CandidateResponseDto>> {
    return this.candidateService.findAll(filters);
  }
}
