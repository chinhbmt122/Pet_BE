import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VaccinationHistoryDomainModel } from '../../domain/vaccination-history.domain';

export class VaccinationResponseDto {
  @ApiProperty({ description: 'Vaccination record ID' })
  id: number;

  @ApiProperty({ description: 'Pet ID' })
  petId: number;

  @ApiProperty({ description: 'Vaccine type ID' })
  vaccineTypeId: number;

  @ApiProperty({ description: 'Date vaccine was administered' })
  administrationDate: Date;

  @ApiPropertyOptional({
    description: 'Next due date (auto-calculated)',
    nullable: true,
  })
  nextDueDate: Date | null;

  @ApiProperty({ description: 'Is vaccination due (computed)' })
  isDue: boolean;

  @ApiPropertyOptional({
    description: 'Days until due (negative = overdue)',
    nullable: true,
  })
  daysUntilDue: number | null;

  @ApiPropertyOptional({ description: 'Vaccine batch number', nullable: true })
  batchNumber: string | null;

  @ApiPropertyOptional({ description: 'Injection site', nullable: true })
  site: string | null;

  @ApiPropertyOptional({ description: 'Reactions observed', nullable: true })
  reactions: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({
    description: 'Administered by (Vet ID)',
    nullable: true,
  })
  administeredBy: number | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  static fromDomain(
    domain: VaccinationHistoryDomainModel,
  ): VaccinationResponseDto {
    const dto = new VaccinationResponseDto();
    dto.id = domain.id!;
    dto.petId = domain.petId;
    dto.vaccineTypeId = domain.vaccineTypeId;
    dto.administrationDate = domain.administrationDate;
    dto.nextDueDate = domain.nextDueDate;
    dto.isDue = domain.isDue();
    dto.daysUntilDue = domain.daysUntilDue();
    dto.batchNumber = domain.batchNumber;
    dto.site = domain.site;
    dto.reactions = domain.reactions;
    dto.notes = domain.notes;
    dto.administeredBy = domain.administeredBy;
    dto.createdAt = domain.createdAt;
    return dto;
  }

  static fromDomainList(
    domains: VaccinationHistoryDomainModel[],
  ): VaccinationResponseDto[] {
    return domains.map((d) => VaccinationResponseDto.fromDomain(d));
  }
}
