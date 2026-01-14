import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for day off data.
 */
export class DayOffResponseDto {
  @ApiProperty({ description: 'Day off ID', example: 1 })
  dayOffId: number;

  @ApiProperty({ description: 'Date of the day off', example: '2026-01-15' })
  date: string;

  @ApiProperty({ description: 'Name of the day off', example: 'New Year' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the day off',
    example: 'Annual holiday celebration',
  })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
