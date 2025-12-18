import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Appointment ID' })
  @IsNotEmpty()
  @IsNumber()
  appointmentId: number;

  @ApiProperty({ description: 'Subtotal amount before discount and tax' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Tax rate as percentage (e.g., 10 for 10%)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
