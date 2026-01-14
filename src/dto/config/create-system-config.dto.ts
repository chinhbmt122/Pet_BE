import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemConfigDto {
  @ApiProperty({
    description: 'Unique configuration key',
    example: 'persistent_days_off',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  configKey: string;

  @ApiProperty({
    description: 'Configuration value (JSON string)',
    example: '[0]',
  })
  @IsString()
  @IsNotEmpty()
  configValue: string;

  @ApiPropertyOptional({
    description: 'Description of this configuration',
    example: 'Days of the week that are always off (0=Sunday, 6=Saturday)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this configuration is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
