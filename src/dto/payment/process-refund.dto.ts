import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Process Refund DTO
 *
 * Used for processing full or partial refunds.
 * Input validation via class-validator decorators.
 */
export class ProcessRefundDto {
  @ApiProperty({ description: 'Refund amount', example: 100000 })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ description: 'Refund reason', example: 'Customer request' })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;
}
