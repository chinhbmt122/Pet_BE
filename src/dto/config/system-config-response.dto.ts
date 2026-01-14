import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemConfigResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  configId: number;

  @ApiProperty({ description: 'Configuration key' })
  configKey: string;

  @ApiProperty({ description: 'Configuration value (JSON string)' })
  configValue: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  description?: string;

  @ApiProperty({ description: 'Whether configuration is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
