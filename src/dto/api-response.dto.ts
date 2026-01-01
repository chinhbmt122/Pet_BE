import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ApiResponseDto<T> {
  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  statusCode: number;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  timestamp: string;

  @ApiProperty({ required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  message?: string;

  @ApiProperty({ nullable: true })
  data: T | null;

  @ApiProperty({ required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  path?: string;

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    path?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
