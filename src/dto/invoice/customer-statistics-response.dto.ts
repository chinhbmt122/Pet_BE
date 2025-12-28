import { ApiProperty } from '@nestjs/swagger';

/**
 * Customer Statistics Response DTO
 *
 * Returns aggregated invoice statistics for a customer (pet owner).
 * Used for customer insights and reporting.
 */
export class CustomerStatisticsResponseDto {
  @ApiProperty({
    description: 'Pet Owner ID',
    example: 1,
  })
  petOwnerId: number;

  @ApiProperty({
    description: 'Total number of visits (invoices)',
    example: 15,
  })
  totalVisits: number;

  @ApiProperty({
    description: 'Total amount spent across all invoices',
    example: 5250000,
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Date of last visit (last invoice)',
    example: '2024-12-28T10:30:00.000Z',
    nullable: true,
    type: 'string',
    format: 'date-time',
  })
  lastVisit: Date | null;

  /**
   * Factory method to create DTO from raw query result
   */
  static fromRaw(raw: {
    petOwnerId: string | number;
    totalVisits: string | number;
    totalSpent: string | number;
    lastVisit: Date | string | null;
  }): CustomerStatisticsResponseDto {
    const dto = new CustomerStatisticsResponseDto();
    dto.petOwnerId = parseInt(raw.petOwnerId.toString());
    dto.totalVisits = parseInt(raw.totalVisits.toString());
    dto.totalSpent = parseFloat(raw.totalSpent.toString()) || 0;
    dto.lastVisit = raw.lastVisit ? new Date(raw.lastVisit) : null;
    return dto;
  }

  /**
   * Factory method to create list of DTOs from raw query results
   */
  static fromRawList(
    rawList: Array<{
      petOwnerId: string | number;
      totalVisits: string | number;
      totalSpent: string | number;
      lastVisit: Date | string | null;
    }>,
  ): CustomerStatisticsResponseDto[] {
    return rawList.map((raw) => CustomerStatisticsResponseDto.fromRaw(raw));
  }
}
