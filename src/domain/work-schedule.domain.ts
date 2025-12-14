/**
 * WorkSchedule Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates employee scheduling with availability checking.
 * Separated from TypeORM persistence entity per ADR-001.
 */
export class WorkScheduleDomainModel {
  private readonly _id: number | null;
  private readonly _employeeId: number;
  private readonly _workDate: Date;
  private _startTime: string;
  private _endTime: string;
  private _breakStart: string | null;
  private _breakEnd: string | null;
  private _isAvailable: boolean;
  private _notes: string | null;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    employeeId: number;
    workDate: Date;
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    isAvailable: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._employeeId = data.employeeId;
    this._workDate = data.workDate;
    this._startTime = data.startTime;
    this._endTime = data.endTime;
    this._breakStart = data.breakStart;
    this._breakEnd = data.breakEnd;
    this._isAvailable = data.isAvailable;
    this._notes = data.notes;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // ===== Static Factory Methods =====

  static create(props: {
    employeeId: number;
    workDate: Date;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    notes?: string;
  }): WorkScheduleDomainModel {
    if (props.endTime <= props.startTime) {
      throw new Error('End time must be after start time');
    }

    return new WorkScheduleDomainModel({
      id: null,
      employeeId: props.employeeId,
      workDate: props.workDate,
      startTime: props.startTime,
      endTime: props.endTime,
      breakStart: props.breakStart ?? null,
      breakEnd: props.breakEnd ?? null,
      isAvailable: true,
      notes: props.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: number;
    employeeId: number;
    workDate: Date;
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    isAvailable: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WorkScheduleDomainModel {
    return new WorkScheduleDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get employeeId(): number {
    return this._employeeId;
  }
  get workDate(): Date {
    return this._workDate;
  }
  get startTime(): string {
    return this._startTime;
  }
  get endTime(): string {
    return this._endTime;
  }
  get breakStart(): string | null {
    return this._breakStart;
  }
  get breakEnd(): string | null {
    return this._breakEnd;
  }
  get isAvailable(): boolean {
    return this._isAvailable;
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

  // ===== Availability Methods =====

  /**
   * Checks if a specific date/time falls within this schedule's available hours.
   * Accounts for break time.
   */
  checkAvailability(dateTime: Date): boolean {
    if (!this._isAvailable) {
      return false;
    }

    // Check if date matches
    const scheduleDate = new Date(this._workDate);
    const checkDate = new Date(dateTime);

    if (scheduleDate.toDateString() !== checkDate.toDateString()) {
      return false;
    }

    // Extract time as HH:MM for comparison
    const hours = checkDate.getHours().toString().padStart(2, '0');
    const mins = checkDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    // Check if within working hours
    if (timeStr < this._startTime || timeStr >= this._endTime) {
      return false;
    }

    // Check if during break time
    if (this._breakStart && this._breakEnd) {
      if (timeStr >= this._breakStart && timeStr < this._breakEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if a time range fits completely within this schedule's working hours.
   */
  fitsWithinSchedule(
    appointmentStart: string,
    appointmentEnd: string,
  ): boolean {
    if (!this._isAvailable) {
      return false;
    }

    return (
      appointmentStart >= this._startTime && appointmentEnd <= this._endTime
    );
  }

  /**
   * Checks if a time range conflicts with this schedule.
   */
  hasConflictWith(rangeStart: string, rangeEnd: string): boolean {
    return this._startTime < rangeEnd && this._endTime > rangeStart;
  }

  /**
   * Gets the total working hours (excluding break).
   */
  getWorkingHours(): number {
    const start = this.timeToMinutes(this._startTime);
    const end = this.timeToMinutes(this._endTime);
    let totalMinutes = end - start;

    // Subtract break time
    if (this._breakStart && this._breakEnd) {
      const breakMinutes =
        this.timeToMinutes(this._breakEnd) -
        this.timeToMinutes(this._breakStart);
      totalMinutes -= breakMinutes;
    }

    return totalMinutes / 60;
  }

  // ===== State Methods =====

  markUnavailable(reason?: string): void {
    this._isAvailable = false;
    if (reason) {
      this._notes = reason;
    }
  }

  markAvailable(): void {
    this._isAvailable = true;
  }

  // ===== Update Methods =====

  updateBreak(breakStart: string | null, breakEnd: string | null): void {
    if (breakStart && breakEnd && breakEnd <= breakStart) {
      throw new Error('Break end must be after break start');
    }
    this._breakStart = breakStart;
    this._breakEnd = breakEnd;
  }

  updateTimes(startTime: string, endTime: string): void {
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
    this._startTime = startTime;
    this._endTime = endTime;
  }

  updateNotes(notes: string | null): void {
    this._notes = notes;
  }

  // ===== Helper Methods =====

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
