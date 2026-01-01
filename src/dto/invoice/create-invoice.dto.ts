import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Create Invoice DTO
 *
 * Used for generating invoices from completed appointments.
 * Input validation via class-validator decorators.
 */
export class CreateInvoiceDto {
  @ApiProperty({ description: 'Appointment ID', example: 1 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  appointmentId: number;

  @ApiProperty({
    description: 'Optional discount code or percentage override',
    example: 'HOLIDAY10',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  discountCode?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  notes?: string;
}
