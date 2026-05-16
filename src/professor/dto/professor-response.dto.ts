import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { StatusEnum } from 'src/statuses/statuses.enum';

export type ProfessorItemData = {
  id: string;
  department: string;
  institution: string;
  firstName?: string | null;
  lastName?: string | null;
  status: StatusEnum;
  email: string;
};

export class ProfessorItemDto {
  @ApiProperty({
    description: 'Unique identifier for the professor',
  })
  readonly id: string;
  @ApiProperty({
    description: 'Department the professor belongs to',
  })
  readonly department: string;
  @ApiProperty({
    description: 'Institution the professor is affiliated with',
  })
  readonly institution: string;

  @ApiProperty({
    description: 'Full name of the professor',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Status of the professor',
    enum: StatusEnum,
  })
  readonly status: StatusEnum;

  @ApiProperty({
    description: 'Email address of the professor',
  })
  readonly email: string;

  constructor(data: ProfessorItemData) {
    this.id = data.id;
    this.department = data.department;
    this.institution = data.institution;
    const first = data.firstName ?? '';
    const last = data.lastName ?? '';
    this.name = `${first} ${last}`.trim();
    this.status = data.status;
    this.email = data.email;
  }
}

export class PaginatedProfessorResponseDto extends PaginatedResponseDto<ProfessorItemDto> {
  @ApiProperty({ type: ProfessorItemDto, isArray: true })
  declare data: ProfessorItemDto[];
}
