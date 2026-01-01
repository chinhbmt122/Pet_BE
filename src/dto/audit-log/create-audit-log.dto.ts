import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuditOperation, ActorType } from '../../entities/types/entity.types';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Table name' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  tableName: string;

  @ApiProperty({ description: 'Record ID' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  recordId: number;

  @ApiProperty({ description: 'Operation type', enum: AuditOperation })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsEnum(AuditOperation, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  operation: AuditOperation;

  @ApiPropertyOptional({ description: 'Changes (JSONB)', nullable: true })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage('validation.isObject') })
  changes?: object;

  @ApiPropertyOptional({ description: 'Actor account ID', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  actorAccountId?: number;

  @ApiPropertyOptional({
    description: 'Actor type',
    enum: ActorType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ActorType, { message: i18nValidationMessage('validation.isEnum') })
  actorType?: ActorType;

  @ApiPropertyOptional({ description: 'IP address', nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(45, { message: i18nValidationMessage('validation.maxLength') })
  ipAddress?: string;
}
