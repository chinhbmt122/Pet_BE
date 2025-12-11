import { ApiProperty } from '@nestjs/swagger';
import { AccountResponseDto } from './account-response.dto';

/**
 * Login Response DTO
 */
export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  account: AccountResponseDto;
}
