import { PartialType } from '@nestjs/swagger';
import { CreateDayOffDto } from './create-day-off.dto';

/**
 * DTO for updating an existing day off.
 * All fields are optional.
 */
export class UpdateDayOffDto extends PartialType(CreateDayOffDto) {}
