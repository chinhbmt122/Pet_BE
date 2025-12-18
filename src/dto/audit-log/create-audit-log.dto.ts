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

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Table name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  tableName: string;

  @ApiProperty({ description: 'Record ID' })
  @IsNotEmpty()
  @IsNumber()
  recordId: number;

  @ApiProperty({ description: 'Operation type', enum: AuditOperation })
  @IsNotEmpty()
  @IsEnum(AuditOperation)
  operation: AuditOperation;

  @ApiPropertyOptional({ description: 'Changes (JSONB)', nullable: true })
  @IsOptional()
  @IsObject()
  changes?: object;

  @ApiPropertyOptional({ description: 'Actor account ID', nullable: true })
  @IsOptional()
  @IsNumber()
  actorAccountId?: number;

  @ApiPropertyOptional({
    description: 'Actor type',
    enum: ActorType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ActorType)
  actorType?: ActorType;

  @ApiPropertyOptional({ description: 'IP address', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;
}
