import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

export class CandidateResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  cpf: string | null;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ enum: RoleEnum })
  role: RoleEnum;

  @ApiProperty({ enum: StatusEnum })
  status: StatusEnum;

  @ApiProperty()
  onboardingCompleted: boolean;

  @ApiProperty()
  universityOfOrigin: string;

  @ApiProperty({ nullable: true })
  ira: string | null;

  @ApiProperty({ nullable: true })
  poscomp: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedCandidateResponseDto extends PaginatedResponseDto<CandidateResponseDto> {
  @ApiProperty({ type: CandidateResponseDto, isArray: true })
  declare data: CandidateResponseDto[];
}
