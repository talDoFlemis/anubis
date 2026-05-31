import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentPeriodResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() semester: string;
  @ApiProperty() startDate: Date;
  @ApiProperty() endDate: Date;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
