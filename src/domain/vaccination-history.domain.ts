/**
 * VaccinationHistory Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates vaccination record with scheduling logic.
 * Separated from TypeORM persistence entity per ADR-001.
 */
export class VaccinationHistoryDomainModel {
  private readonly _id: number | null;
  private readonly _petId: number; // OWNER: Vaccination is for this pet
  private readonly _vaccineTypeId: number; // IDENTITY: What vaccine was given (historical fact)
  private _medicalRecordId: number | null; // REFERENCE: Associated record (linkable)
  private _batchNumber: string | null;
  private _site: string | null;
  private _administeredBy: number | null; // REFERENCE: Who gave it (correctable)
  private _reactions: string | null;
  private readonly _administrationDate: Date; // IDENTITY: When given (historical fact)
  private _nextDueDate: Date | null;
  private _notes: string | null;
  private readonly _createdAt: Date;

  // Denormalized vaccine info for domain calculations
  private _vaccineBoosterIntervalMonths: number | null;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    petId: number;
    vaccineTypeId: number;
    medicalRecordId: number | null;
    batchNumber: string | null;
    site: string | null;
    administeredBy: number | null;
    reactions: string | null;
    administrationDate: Date;
    nextDueDate: Date | null;
    notes: string | null;
    createdAt: Date;
    vaccineBoosterIntervalMonths?: number | null;
  }) {
    this._id = data.id;
    this._petId = data.petId;
    this._vaccineTypeId = data.vaccineTypeId;
    this._medicalRecordId = data.medicalRecordId;
    this._batchNumber = data.batchNumber;
    this._site = data.site;
    this._administeredBy = data.administeredBy;
    this._reactions = data.reactions;
    this._administrationDate = data.administrationDate;
    this._nextDueDate = data.nextDueDate;
    this._notes = data.notes;
    this._createdAt = data.createdAt;
    this._vaccineBoosterIntervalMonths =
      data.vaccineBoosterIntervalMonths ?? null;
  }

  // ===== Static Factory Methods =====

  static create(props: {
    petId: number;
    vaccineTypeId: number;
    medicalRecordId?: number;
    batchNumber?: string;
    site?: string;
    administeredBy: number;
    reactions?: string;
    administrationDate: Date;
    notes?: string;
    vaccineBoosterIntervalMonths?: number;
  }): VaccinationHistoryDomainModel {
    const model = new VaccinationHistoryDomainModel({
      id: null,
      petId: props.petId,
      vaccineTypeId: props.vaccineTypeId,
      medicalRecordId: props.medicalRecordId ?? null,
      batchNumber: props.batchNumber ?? null,
      site: props.site ?? null,
      administeredBy: props.administeredBy,
      reactions: props.reactions ?? null,
      administrationDate: props.administrationDate,
      nextDueDate: null,
      notes: props.notes ?? null,
      createdAt: new Date(),
      vaccineBoosterIntervalMonths: props.vaccineBoosterIntervalMonths,
    });

    // Calculate next due date if interval provided
    if (props.vaccineBoosterIntervalMonths) {
      model._nextDueDate = model.calculateNextDueDate();
    }

    return model;
  }

  static reconstitute(props: {
    id: number;
    petId: number;
    vaccineTypeId: number;
    medicalRecordId: number | null;
    batchNumber: string | null;
    site: string | null;
    administeredBy: number | null;
    reactions: string | null;
    administrationDate: Date;
    nextDueDate: Date | null;
    notes: string | null;
    createdAt: Date;
    vaccineBoosterIntervalMonths?: number | null;
  }): VaccinationHistoryDomainModel {
    return new VaccinationHistoryDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get petId(): number {
    return this._petId;
  }
  get vaccineTypeId(): number {
    return this._vaccineTypeId;
  }
  get medicalRecordId(): number | null {
    return this._medicalRecordId;
  }
  get batchNumber(): string | null {
    return this._batchNumber;
  }
  get site(): string | null {
    return this._site;
  }
  get administeredBy(): number | null {
    return this._administeredBy;
  }
  get reactions(): string | null {
    return this._reactions;
  }
  get administrationDate(): Date {
    return this._administrationDate;
  }
  get nextDueDate(): Date | null {
    return this._nextDueDate;
  }
  get notes(): string | null {
    return this._notes;
  }
  get createdAt(): Date {
    return this._createdAt;
  }

  // ===== Domain Methods =====

  /**
   * Calculates the next due date based on vaccine booster interval.
   */
  calculateNextDueDate(): Date | null {
    if (!this._vaccineBoosterIntervalMonths) {
      return null;
    }

    const nextDate = new Date(this._administrationDate);
    nextDate.setMonth(nextDate.getMonth() + this._vaccineBoosterIntervalMonths);

    return nextDate;
  }

  /**
   * Checks if vaccination is due (nextDueDate has passed).
   */
  isDue(): boolean {
    if (!this._nextDueDate) {
      return false;
    }
    return new Date() > new Date(this._nextDueDate);
  }

  /**
   * Returns days until next vaccination is due.
   * Negative value means overdue.
   */
  daysUntilDue(): number | null {
    if (!this._nextDueDate) {
      return null;
    }
    const now = new Date();
    const dueDate = new Date(this._nextDueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===== Update Methods =====

  /**
   * Update vaccination record details
   */
  updateDetails(props: {
    batchNumber?: string | null;
    site?: string | null;
    reactions?: string | null;
    notes?: string | null;
  }): void {
    if (props.batchNumber !== undefined) this._batchNumber = props.batchNumber;
    if (props.site !== undefined) this._site = props.site;
    if (props.reactions !== undefined) this._reactions = props.reactions;
    if (props.notes !== undefined) this._notes = props.notes;
  }

  linkToMedicalRecord(recordId: number): void {
    this._medicalRecordId = recordId;
  }

  setBoosterInterval(months: number): void {
    this._vaccineBoosterIntervalMonths = months;
    this._nextDueDate = this.calculateNextDueDate();
  }

  /**
   * Correct the veterinarian who administered the vaccine
   */
  correctAdministrator(veterinarianId: number): void {
    this._administeredBy = veterinarianId;
  }
}
