import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string | null;

  @ApiProperty()
  firstName: string | null;

  @ApiProperty()
  lastName: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  onboardingCompleted: boolean;

  @ApiProperty()
  mustChangePassword: boolean;
}
