import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  discount?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  tax?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;
}
