import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

/**
 * DTO for updating an existing service.
 * All fields from CreateServiceDto become optional.
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
