import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { Employee } from './employee.entity';

/**
 * WorkSchedule Entity
 *
 * Renamed from Schedule per v3.0 OOAD principles.
 * Manages employee availability for appointment booking.
 * Used ONLY for availability checking (Law of Demeter).
 */
@Check('"endTime" > "startTime"')
@Entity('work_schedules')
export class WorkSchedule {
  @PrimaryGeneratedColumn('increment')
  scheduleId: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.workSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  workDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'time', nullable: true })
  breakStart: string;

  @Column({ type: 'time', nullable: true })
  breakEnd: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  /** Optional notes or reason for unavailability */
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== Domain Methods (per ADR-002: Pragmatic + Methods) =====

  /**
   * Checks if a specific date/time falls within this schedule's available hours.
   * Accounts for break time.
   *
   * @param dateTime - The date/time to check
   * @returns true if the employee is available at this time
   */
  checkAvailability(dateTime: Date): boolean {
    if (!this.isAvailable) {
      return false;
    }

    // Check if date matches
    const scheduleDate = new Date(this.workDate);
    const checkDate = new Date(dateTime);

    if (scheduleDate.toDateString() !== checkDate.toDateString()) {
      return false;
    }

    // Extract time as HH:MM for comparison
    const hours = checkDate.getHours().toString().padStart(2, '0');
    const mins = checkDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    // Check if within working hours
    if (timeStr < this.startTime || timeStr >= this.endTime) {
      return false;
    }

    // Check if during break time
    if (this.breakStart && this.breakEnd) {
      if (timeStr >= this.breakStart && timeStr < this.breakEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if a time range fits completely within this schedule's working hours.
   * Used for booking appointments - the entire appointment must fit.
   *
   * @param appointmentStart - Start time (HH:MM format)
   * @param appointmentEnd - End time (HH:MM format)
   * @returns true if the range fits within working hours
   */
  fitsWithinSchedule(appointmentStart: string, appointmentEnd: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    // Appointment must start at or after schedule start AND end at or before schedule end
    return appointmentStart >= this.startTime && appointmentEnd <= this.endTime;
  }

  /**
   * Checks if a time range conflicts with this schedule.
   * Used for detecting overlapping schedules or double-bookings.
   *
   * @param rangeStart - Start of the range (HH:MM format)
   * @param rangeEnd - End of the range (HH:MM format)
   * @returns true if there's any overlap (conflict)
   */
  hasConflictWith(rangeStart: string, rangeEnd: string): boolean {
    // Standard interval overlap: A and B overlap if A.start < B.end AND A.end > B.start
    return this.startTime < rangeEnd && this.endTime > rangeStart;
  }

  /**
   * Gets the total working hours (excluding break).
   *
   * @returns Number of working hours
   */
  getWorkingHours(): number {
    const start = this.timeToMinutes(this.startTime);
    const end = this.timeToMinutes(this.endTime);
    let totalMinutes = end - start;

    // Subtract break time
    if (this.breakStart && this.breakEnd) {
      const breakMinutes =
        this.timeToMinutes(this.breakEnd) - this.timeToMinutes(this.breakStart);
      totalMinutes -= breakMinutes;
    }

    return totalMinutes / 60;
  }

  /**
   * Helper: Converts HH:MM string to minutes since midnight.
   * Example: "09:30" → 570 (9 * 60 + 30)
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
