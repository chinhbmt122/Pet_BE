import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkScheduleDomainModel } from '../../domain/work-schedule.domain';

/**
 * Response DTO for work schedule data.
 */
export class WorkScheduleResponseDto {
  @ApiProperty({ description: 'Schedule ID' })
  id: number;

  @ApiProperty({ description: 'Employee ID' })
  employeeId: number;

  @ApiProperty({ description: 'Work date' })
  workDate: Date;

  @ApiProperty({ description: 'Start time (HH:MM)' })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:MM)' })
  endTime: string;

  @ApiPropertyOptional({ description: 'Break start time', nullable: true })
  breakStart: string | null;

  @ApiPropertyOptional({ description: 'Break end time', nullable: true })
  breakEnd: string | null;

  @ApiProperty({ description: 'Is schedule available for booking' })
  isAvailable: boolean;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Computed total working hours' })
  workingHours: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  static fromDomain(domain: WorkScheduleDomainModel): WorkScheduleResponseDto {
    const dto = new WorkScheduleResponseDto();
    dto.id = domain.id!;
    dto.employeeId = domain.employeeId;
    dto.workDate = domain.workDate;
    dto.startTime = domain.startTime;
    dto.endTime = domain.endTime;
    dto.breakStart = domain.breakStart;
    dto.breakEnd = domain.breakEnd;
    dto.isAvailable = domain.isAvailable;
    dto.notes = domain.notes;
    dto.workingHours = domain.getWorkingHours();
    dto.createdAt = domain.createdAt;
    return dto;
  }

  static fromDomainList(domains: WorkScheduleDomainModel[]): WorkScheduleResponseDto[] {
    return domains.map((d) => WorkScheduleResponseDto.fromDomain(d));
  }
}
