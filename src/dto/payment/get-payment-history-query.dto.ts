import { IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Get Payment History Query DTO
 *
 * Query parameters for retrieving payment history.
 * Input validation via class-validator decorators.
 */
export class GetPaymentHistoryQueryDto {
  @ApiProperty({
    description: 'Customer ID (Pet Owner ID)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Customer ID must be a number' })
  @Type(() => Number)
  customerId?: number;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate?: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate?: string;
}
