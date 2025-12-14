import { CageAssignmentStatus } from '../entities/types/entity.types';

/**
 * CageAssignment Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates cage assignment lifecycle with check-in/check-out logic.
 */
export class CageAssignmentDomainModel {
  private readonly _id: number | null;
  private readonly _cageId: number; // OWNER: Assignment is for this cage
  private readonly _petId: number; // OWNER: Assignment is for this pet
  private readonly _checkInDate: Date; // IDENTITY: When stay started
  private _expectedCheckOutDate: Date | null;
  private _actualCheckOutDate: Date | null;
  private readonly _dailyRate: number; // Snapshot at booking time
  private _assignedById: number | null;
  private _status: CageAssignmentStatus;
  private _notes: string | null;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    cageId: number;
    petId: number;
    checkInDate: Date;
    expectedCheckOutDate: Date | null;
    actualCheckOutDate: Date | null;
    dailyRate: number;
    assignedById: number | null;
    status: CageAssignmentStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._cageId = data.cageId;
    this._petId = data.petId;
    this._checkInDate = data.checkInDate;
    this._expectedCheckOutDate = data.expectedCheckOutDate;
    this._actualCheckOutDate = data.actualCheckOutDate;
    this._dailyRate = data.dailyRate;
    this._assignedById = data.assignedById;
    this._status = data.status;
    this._notes = data.notes;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Create new cage assignment (check-in)
   */
  static create(props: {
    cageId: number;
    petId: number;
    dailyRate: number;
    checkInDate?: Date;
    expectedCheckOutDate?: Date;
    assignedById?: number;
    notes?: string;
  }): CageAssignmentDomainModel {
    if (props.dailyRate < 0) {
      throw new Error('Daily rate cannot be negative');
    }

    const checkInDate = props.checkInDate ?? new Date();

    if (
      props.expectedCheckOutDate &&
      props.expectedCheckOutDate < checkInDate
    ) {
      throw new Error('Expected check-out date cannot be before check-in date');
    }

    return new CageAssignmentDomainModel({
      id: null,
      cageId: props.cageId,
      petId: props.petId,
      checkInDate,
      expectedCheckOutDate: props.expectedCheckOutDate ?? null,
      actualCheckOutDate: null,
      dailyRate: props.dailyRate,
      assignedById: props.assignedById ?? null,
      status: CageAssignmentStatus.ACTIVE,
      notes: props.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: number;
    cageId: number;
    petId: number;
    checkInDate: Date;
    expectedCheckOutDate: Date | null;
    actualCheckOutDate: Date | null;
    dailyRate: number;
    assignedById: number | null;
    status: CageAssignmentStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CageAssignmentDomainModel {
    return new CageAssignmentDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get cageId(): number {
    return this._cageId;
  }
  get petId(): number {
    return this._petId;
  }
  get checkInDate(): Date {
    return this._checkInDate;
  }
  get expectedCheckOutDate(): Date | null {
    return this._expectedCheckOutDate;
  }
  get actualCheckOutDate(): Date | null {
    return this._actualCheckOutDate;
  }
  get dailyRate(): number {
    return this._dailyRate;
  }
  get assignedById(): number | null {
    return this._assignedById;
  }
  get status(): CageAssignmentStatus {
    return this._status;
  }
  get notes(): string | null {
    return this._notes;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== State Transition Methods =====

  /**
   * Complete the assignment (check-out)
   * @throws Error if assignment is not active
   */
  checkOut(): void {
    if (this._status !== CageAssignmentStatus.ACTIVE) {
      throw new Error(`Cannot check out assignment in ${this._status} status`);
    }
    this._actualCheckOutDate = new Date();
    this._status = CageAssignmentStatus.COMPLETED;
  }

  /**
   * Cancel the assignment
   * @throws Error if assignment is already completed
   */
  cancel(): void {
    if (this._status === CageAssignmentStatus.COMPLETED) {
      throw new Error('Cannot cancel completed assignment');
    }
    if (this._status === CageAssignmentStatus.CANCELLED) {
      throw new Error('Assignment is already cancelled');
    }
    this._status = CageAssignmentStatus.CANCELLED;
  }

  /**
   * Extend the expected check-out date
   * @throws Error if assignment is not active
   */
  extend(newExpectedCheckOutDate: Date): void {
    if (this._status !== CageAssignmentStatus.ACTIVE) {
      throw new Error(`Cannot extend assignment in ${this._status} status`);
    }
    if (newExpectedCheckOutDate < this._checkInDate) {
      throw new Error('New check-out date cannot be before check-in date');
    }
    this._expectedCheckOutDate = newExpectedCheckOutDate;
  }

  // ===== Guard Methods =====

  isActive(): boolean {
    return this._status === CageAssignmentStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this._status === CageAssignmentStatus.COMPLETED;
  }

  canCheckOut(): boolean {
    return this._status === CageAssignmentStatus.ACTIVE;
  }

  // ===== Calculation Methods =====

  /**
   * Calculate total cost based on actual or expected days
   */
  calculateTotalCost(): number {
    const endDate =
      this._actualCheckOutDate ?? this._expectedCheckOutDate ?? new Date();
    const days = this.calculateDays(this._checkInDate, endDate);
    return days * this._dailyRate;
  }

  /**
   * Calculate number of days between two dates
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / oneDay,
    );
    return Math.max(1, diffDays); // Minimum 1 day
  }

  /**
   * Get days remaining until expected check-out
   */
  getDaysRemaining(): number | null {
    if (
      !this._expectedCheckOutDate ||
      this._status !== CageAssignmentStatus.ACTIVE
    ) {
      return null;
    }
    return this.calculateDays(new Date(), this._expectedCheckOutDate);
  }

  // ===== Update Methods =====

  updateNotes(notes: string | null): void {
    this._notes = notes;
  }

  /**
   * Correct the employee who created this assignment
   */
  correctAssigner(employeeId: number): void {
    this._assignedById = employeeId;
  }
}
