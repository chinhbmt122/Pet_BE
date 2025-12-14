import { AppointmentStatus } from '../entities/types/entity.types';

/**
 * Appointment Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates appointment state transitions with validation.
 * Ensures only valid state transitions are allowed via State Pattern.
 *
 * @see epics.md → ADR-001, ADR-003 (Encapsulation)
 */
export class AppointmentDomainModel {
  private readonly _id: number | null;
  private _status: AppointmentStatus;
  private readonly _petId: number; // OWNER: Appointment for this pet
  private _employeeId: number; // REFERENCE: Assigned vet (can be reassigned)
  private readonly _serviceId: number; // IDENTITY: What service was booked
  private _appointmentDate: Date;
  private _startTime: string;
  private _endTime: string;
  private _notes: string | null;
  private _cancellationReason: string | null;
  private _cancelledAt: Date | null;
  private _estimatedCost: number | null;
  private _actualCost: number | null;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    status: AppointmentStatus;
    petId: number;
    employeeId: number;
    serviceId: number;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    notes: string | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    estimatedCost: number | null;
    actualCost: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._status = data.status;
    this._petId = data.petId;
    this._employeeId = data.employeeId;
    this._serviceId = data.serviceId;
    this._appointmentDate = data.appointmentDate;
    this._startTime = data.startTime;
    this._endTime = data.endTime;
    this._notes = data.notes;
    this._cancellationReason = data.cancellationReason;
    this._cancelledAt = data.cancelledAt;
    this._estimatedCost = data.estimatedCost;
    this._actualCost = data.actualCost;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Creates a new appointment (for new bookings)
   */
  static create(props: {
    petId: number;
    employeeId: number;
    serviceId: number;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    notes?: string | null;
    estimatedCost?: number | null;
  }): AppointmentDomainModel {
    return new AppointmentDomainModel({
      id: null,
      status: AppointmentStatus.PENDING,
      petId: props.petId,
      employeeId: props.employeeId,
      serviceId: props.serviceId,
      appointmentDate: props.appointmentDate,
      startTime: props.startTime,
      endTime: props.endTime,
      notes: props.notes ?? null,
      cancellationReason: null,
      cancelledAt: null,
      estimatedCost: props.estimatedCost ?? null,
      actualCost: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitutes from persistence (used by mapper)
   */
  static reconstitute(props: {
    id: number;
    status: AppointmentStatus;
    petId: number;
    employeeId: number;
    serviceId: number;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    notes: string | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    estimatedCost: number | null;
    actualCost: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): AppointmentDomainModel {
    return new AppointmentDomainModel(props);
  }

  // ===== Getters (encapsulation) =====

  get id(): number | null {
    return this._id;
  }
  get status(): AppointmentStatus {
    return this._status;
  }
  get petId(): number {
    return this._petId;
  }
  get employeeId(): number {
    return this._employeeId;
  }
  get serviceId(): number {
    return this._serviceId;
  }
  get appointmentDate(): Date {
    return this._appointmentDate;
  }
  get startTime(): string {
    return this._startTime;
  }
  get endTime(): string {
    return this._endTime;
  }
  get notes(): string | null {
    return this._notes;
  }
  get cancellationReason(): string | null {
    return this._cancellationReason;
  }
  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }
  get estimatedCost(): number | null {
    return this._estimatedCost;
  }
  get actualCost(): number | null {
    return this._actualCost;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== State Transition Methods (State Pattern) =====

  /**
   * Confirms a pending appointment.
   * Transition: PENDING → CONFIRMED
   * @throws Error if appointment is not in PENDING status
   */
  confirm(): void {
    if (!this.canConfirm()) {
      throw new Error(
        `Cannot confirm appointment: current status is ${this._status}, expected PENDING`,
      );
    }
    this._status = AppointmentStatus.CONFIRMED;
  }

  /**
   * Cancels an appointment.
   * Transition: PENDING/CONFIRMED → CANCELLED
   * @param reason Optional cancellation reason
   * @throws Error if appointment cannot be cancelled
   */
  cancel(reason?: string): void {
    if (!this.canCancel()) {
      throw new Error(
        `Cannot cancel appointment: current status is ${this._status}, expected PENDING or CONFIRMED`,
      );
    }
    this._status = AppointmentStatus.CANCELLED;
    this._cancellationReason = reason || null;
    this._cancelledAt = new Date();
  }

  /**
   * Starts appointment execution.
   * Transition: CONFIRMED → IN_PROGRESS
   * @throws Error if appointment is not CONFIRMED
   */
  startExecution(): void {
    if (!this.canStart()) {
      throw new Error(
        `Cannot start appointment: current status is ${this._status}, expected CONFIRMED`,
      );
    }
    this._status = AppointmentStatus.IN_PROGRESS;
  }

  /**
   * Completes the appointment.
   * Transition: IN_PROGRESS → COMPLETED
   * @throws Error if appointment is not IN_PROGRESS
   */
  complete(): void {
    if (!this.canComplete()) {
      throw new Error(
        `Cannot complete appointment: current status is ${this._status}, expected IN_PROGRESS`,
      );
    }
    this._status = AppointmentStatus.COMPLETED;
  }

  // ===== Update Methods =====

  /**
   * Update appointment notes
   * @throws Error if appointment is cancelled
   */
  updateNotes(notes: string | null): void {
    if (this._status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot update notes for cancelled appointment');
    }
    this._notes = notes;
  }

  /**
   * Update estimated cost (before service starts)
   * @throws Error if service has already started
   */
  updateEstimatedCost(cost: number): void {
    if (
      this._status !== AppointmentStatus.PENDING &&
      this._status !== AppointmentStatus.CONFIRMED
    ) {
      throw new Error('Can only update estimated cost before service starts');
    }
    if (cost < 0) {
      throw new Error('Estimated cost cannot be negative');
    }
    this._estimatedCost = cost;
  }

  /**
   * Record actual cost (during or after service)
   */
  recordActualCost(cost: number): void {
    if (cost < 0) {
      throw new Error('Actual cost cannot be negative');
    }
    this._actualCost = cost;
  }

  /**
   * Reschedule appointment to new date/time
   * @throws Error if appointment cannot be rescheduled
   */
  reschedule(props: {
    appointmentDate?: Date;
    startTime?: string;
    endTime?: string;
  }): void {
    if (!this.canReschedule()) {
      throw new Error(
        `Cannot reschedule appointment in ${this._status} status`,
      );
    }
    if (props.appointmentDate !== undefined) {
      this._appointmentDate = props.appointmentDate;
    }
    if (props.startTime !== undefined) {
      this._startTime = props.startTime;
    }
    if (props.endTime !== undefined) {
      this._endTime = props.endTime;
    }
  }

  /**
   * Change assigned employee
   * @throws Error if appointment cannot be reassigned
   */
  changeEmployee(employeeId: number): void {
    if (!this.canReschedule()) {
      throw new Error(
        `Cannot change employee for appointment in ${this._status} status`,
      );
    }
    this._employeeId = employeeId;
  }

  // ===== Guard Methods =====

  canConfirm(): boolean {
    return this._status === AppointmentStatus.PENDING;
  }

  canCancel(): boolean {
    return (
      this._status === AppointmentStatus.PENDING ||
      this._status === AppointmentStatus.CONFIRMED
    );
  }

  canStart(): boolean {
    return this._status === AppointmentStatus.CONFIRMED;
  }

  canComplete(): boolean {
    return this._status === AppointmentStatus.IN_PROGRESS;
  }

  canReschedule(): boolean {
    return (
      this._status === AppointmentStatus.PENDING ||
      this._status === AppointmentStatus.CONFIRMED
    );
  }
}
