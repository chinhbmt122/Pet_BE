import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordController } from '../controllers/medical-record.controller';
import { MedicalRecordService } from '../services/medical-record.service';
import { MedicalRecord } from '../entities/medical-record.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import { VaccinationHistory } from '../entities/vaccination-history.entity';
import { Pet } from '../entities/pet.entity';
import { Veterinarian } from '../entities/veterinarian.entity';

/**
 * MedicalRecordModule
 *
 * Manages veterinary examination records.
 * Handles creation and viewing of medical records by authorized veterinarians.
 * Records diagnosis, treatment details, prescriptions, and follow-up recommendations.
 * Maintains complete medical history for each pet.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      VaccineType,
      VaccinationHistory,
      Pet,
      Veterinarian,
    ]),
  ],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService],
  exports: [MedicalRecordService],
})
export class MedicalRecordModule {}

