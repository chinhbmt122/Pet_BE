import { ApiProperty } from '@nestjs/swagger';

export type JwtPayload = {
  id: number;
  email: string;
};

export class JwtTokenReturn {
  @ApiProperty()
  accessToken: string;
}
