import { PartialType } from '@nestjs/swagger';
import { CreateWorkScheduleDto } from './create-work-schedule.dto';

/**
 * DTO for updating an existing work schedule.
 * All fields from CreateWorkScheduleDto become optional.
 */
export class UpdateWorkScheduleDto extends PartialType(CreateWorkScheduleDto) {}
