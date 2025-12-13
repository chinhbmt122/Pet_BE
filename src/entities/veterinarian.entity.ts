import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Employee } from './employee.entity';
import { MedicalRecord } from './medical-record.entity';
import { VaccinationHistory } from './vaccination-history.entity';

/**
 * Veterinarian Entity
 *
 * Child entity of Employee for veterinary staff.
 * Has additional fields for license and expertise.
 */
@ChildEntity('VETERINARIAN')
export class Veterinarian extends Employee {
    /**
     * Veterinarian license number (required)
     */
    @Column({ type: 'varchar', length: 100 })
    licenseNumber: string;

    /**
     * Areas of veterinary expertise
     * e.g., "surgery, dermatology, internal medicine"
     */
    @Column({ type: 'text', nullable: true })
    expertise: string;

    /**
     * One-to-Many relationship with MedicalRecord
     * A veterinarian can create multiple medical records
     */
    @OneToMany(() => MedicalRecord, (record) => record.veterinarian)
    medicalRecords?: MedicalRecord[];

    /**
     * One-to-Many relationship with VaccinationHistory
     * A veterinarian can administer multiple vaccinations
     */
    @OneToMany(() => VaccinationHistory, (vaccination) => vaccination.administrator)
    vaccinationsAdministered?: VaccinationHistory[];
}
