import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ApiResponseDto<T> {
  @ApiProperty()
  @IsNumber()
  statusCode: number;

  @ApiProperty()
  @IsString()
  timestamp: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ nullable: true })
  data: T | null;

  @ApiProperty({ required: false })
  @IsString()
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
