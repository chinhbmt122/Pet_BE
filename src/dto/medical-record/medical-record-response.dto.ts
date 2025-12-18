import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalRecordDomainModel } from '../../domain/medical-record.domain';

export class MedicalRecordResponseDto {
  @ApiProperty({ description: 'Record ID' })
  id: number;

  @ApiProperty({ description: 'Pet ID' })
  petId: number;

  @ApiProperty({ description: 'Veterinarian ID' })
  veterinarianId: number;

  @ApiPropertyOptional({ description: 'Appointment ID', nullable: true })
  appointmentId: number | null;

  @ApiProperty({ description: 'Diagnosis' })
  diagnosis: string;

  @ApiProperty({ description: 'Treatment' })
  treatment: string;

  @ApiPropertyOptional({
    description: 'Medical summary (JSONB)',
    nullable: true,
  })
  medicalSummary: object | null;

  @ApiPropertyOptional({ description: 'Follow-up date', nullable: true })
  followUpDate: Date | null;

  @ApiProperty({ description: 'Is follow-up overdue (computed)' })
  isFollowUpOverdue: boolean;

  @ApiProperty({ description: 'Needs follow-up (computed)' })
  needsFollowUp: boolean;

  @ApiProperty({ description: 'Examination date' })
  examinationDate: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  static fromDomain(
    domain: MedicalRecordDomainModel,
  ): MedicalRecordResponseDto {
    const dto = new MedicalRecordResponseDto();
    dto.id = domain.id!;
    dto.petId = domain.petId;
    dto.veterinarianId = domain.veterinarianId;
    dto.appointmentId = domain.appointmentId;
    dto.diagnosis = domain.diagnosis;
    dto.treatment = domain.treatment;
    dto.medicalSummary = domain.medicalSummary;
    dto.followUpDate = domain.followUpDate;
    dto.isFollowUpOverdue = domain.isFollowUpOverdue();
    dto.needsFollowUp = domain.needsFollowUp();
    dto.examinationDate = domain.examinationDate;
    dto.createdAt = domain.createdAt;
    return dto;
  }

  static fromDomainList(
    domains: MedicalRecordDomainModel[],
  ): MedicalRecordResponseDto[] {
    return domains.map((d) => MedicalRecordResponseDto.fromDomain(d));
  }
}
