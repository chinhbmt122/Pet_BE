/**
 * MedicalRecord Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates medical record data with update methods.
 * Separated from TypeORM persistence entity per ADR-001.
 */
export class MedicalRecordDomainModel {
    private readonly _id: number | null;
    private readonly _petId: number;           // OWNER: Record belongs to this pet
    private _veterinarianId: number;           // REFERENCE: Who did the exam (correctable)
    private _appointmentId: number | null;
    private readonly _examinationDate: Date;
    private _diagnosis: string;
    private _treatment: string;
    private _medicalSummary: object | null;
    private _followUpDate: Date | null;
    private readonly _createdAt: Date;
    private readonly _updatedAt: Date;

    // ===== Private Constructor =====

    private constructor(data: {
        id: number | null;
        petId: number;
        veterinarianId: number;
        appointmentId: number | null;
        examinationDate: Date;
        diagnosis: string;
        treatment: string;
        medicalSummary: object | null;
        followUpDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this._id = data.id;
        this._petId = data.petId;
        this._veterinarianId = data.veterinarianId;
        this._appointmentId = data.appointmentId;
        this._examinationDate = data.examinationDate;
        this._diagnosis = data.diagnosis;
        this._treatment = data.treatment;
        this._medicalSummary = data.medicalSummary;
        this._followUpDate = data.followUpDate;
        this._createdAt = data.createdAt;
        this._updatedAt = data.updatedAt;
    }

    // ===== Static Factory Methods =====

    static create(props: {
        petId: number;
        veterinarianId: number;
        diagnosis: string;
        treatment: string;
        appointmentId?: number;
        medicalSummary?: object;
        followUpDate?: Date;
    }): MedicalRecordDomainModel {
        return new MedicalRecordDomainModel({
            id: null,
            petId: props.petId,
            veterinarianId: props.veterinarianId,
            appointmentId: props.appointmentId ?? null,
            examinationDate: new Date(),
            diagnosis: props.diagnosis,
            treatment: props.treatment,
            medicalSummary: props.medicalSummary ?? null,
            followUpDate: props.followUpDate ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static reconstitute(props: {
        id: number;
        petId: number;
        veterinarianId: number;
        appointmentId: number | null;
        examinationDate: Date;
        diagnosis: string;
        treatment: string;
        medicalSummary: object | null;
        followUpDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): MedicalRecordDomainModel {
        return new MedicalRecordDomainModel(props);
    }

    // ===== Getters =====

    get id(): number | null {
        return this._id;
    }
    get petId(): number {
        return this._petId;
    }
    get veterinarianId(): number {
        return this._veterinarianId;
    }
    get appointmentId(): number | null {
        return this._appointmentId;
    }
    get examinationDate(): Date {
        return this._examinationDate;
    }
    get diagnosis(): string {
        return this._diagnosis;
    }
    get treatment(): string {
        return this._treatment;
    }
    get medicalSummary(): object | null {
        return this._medicalSummary;
    }
    get followUpDate(): Date | null {
        return this._followUpDate;
    }
    get createdAt(): Date {
        return this._createdAt;
    }
    get updatedAt(): Date {
        return this._updatedAt;
    }

    // ===== Domain Methods =====

    /**
     * Check if follow-up is needed
     */
    needsFollowUp(): boolean {
        return this._followUpDate !== null;
    }

    /**
     * Check if follow-up is overdue
     */
    isFollowUpOverdue(): boolean {
        if (!this._followUpDate) return false;
        return new Date() > new Date(this._followUpDate);
    }

    // ===== Update Methods =====

    /**
     * Update medical record details
     */
    updateDetails(props: {
        diagnosis?: string;
        treatment?: string;
        medicalSummary?: object | null;
        followUpDate?: Date | null;
    }): void {
        if (props.diagnosis !== undefined) this._diagnosis = props.diagnosis;
        if (props.treatment !== undefined) this._treatment = props.treatment;
        if (props.medicalSummary !== undefined) this._medicalSummary = props.medicalSummary;
        if (props.followUpDate !== undefined) this._followUpDate = props.followUpDate;
    }

    linkToAppointment(appointmentId: number): void {
        this._appointmentId = appointmentId;
    }

    /**
     * Correct the veterinarian who performed the examination
     */
    correctVeterinarian(veterinarianId: number): void {
        this._veterinarianId = veterinarianId;
    }
}
