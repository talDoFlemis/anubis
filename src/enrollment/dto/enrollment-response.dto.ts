import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MastersDegreeData, PoscompData } from '../../database/schema/enrollments';

export class EnrollmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() candidateId!: string;
  @ApiProperty() enrollmentPeriodId!: string;
  @ApiProperty() level!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() justification!: string | null;
  @ApiPropertyOptional() sigaaCode!: string | null;
  @ApiPropertyOptional() sigaaReceiptFileId!: string | null;
  @ApiPropertyOptional() declaration!: boolean | null;
  @ApiPropertyOptional() poscomp!: PoscompData | null;
  @ApiPropertyOptional() mastersDegrees!: MastersDegreeData[] | null;
  @ApiPropertyOptional() scoreDraft!: string | null;
  @ApiPropertyOptional() submittedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
