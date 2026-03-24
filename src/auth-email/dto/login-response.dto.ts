import { ApiProperty } from '@nestjs/swagger';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';

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

  @ApiProperty({ enum: AuthProvidersEnum })
  authProvider: AuthProvidersEnum;
}
