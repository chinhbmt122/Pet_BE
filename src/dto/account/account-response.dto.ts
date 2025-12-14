import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../entities/account.entity';

/**
 * Account Response DTO
 */
export class AccountResponseDto {
  @ApiProperty()
  accountId: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  petOwner?: any;

  @ApiProperty({ required: false })
  employee?: any;
}
