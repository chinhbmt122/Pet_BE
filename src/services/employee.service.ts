import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { UserType } from '../entities/types/entity.types';
import { AccountFactory } from '../factories/account.factory';
import { EmployeeFactory } from '../factories/employee.factory';
import { EmployeeMapper } from '../mappers/employee.mapper';
import {
  VeterinarianDomainModel,
  CareStaffDomainModel,
} from '../domain/employee.domain';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee';

/**
 * EmployeeService
 *
 * Handles all employee operations:
 * - Create employee (Manager only)
 * - Get employees (by ID, by role, all)
 * - Update profile, employment details, availability
 * - Deactivate employee
 *
 * SECURITY: Creation/modification requires Manager role.
 */
@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly accountFactory: AccountFactory,
    private readonly employeeFactory: EmployeeFactory,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== Create ====================

  /**
   * Creates a new employee account (Manager only).
   */
  async create(
    callerAccountId: number,
    dto: CreateEmployeeDto,
  ): Promise<Employee> {
    await this.verifyIsManager(callerAccountId);

    if (dto.userType === UserType.PET_OWNER) {
      I18nException.forbidden('errors.forbidden.accessDenied');
    }

    return this.dataSource.transaction(async (manager) => {
      // Create Account
      const account = await this.accountFactory.create(
        dto.email,
        dto.password,
        dto.userType,
      );
      const savedAccount = await manager.save(Account, account);

      // Create Employee
      const baseProps = {
        accountId: savedAccount.accountId,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        address: dto.address ?? null,
        hireDate: dto.hireDate,
        salary: dto.salary,
      };

      let employee: Employee;
      switch (dto.userType) {
        case UserType.VETERINARIAN:
          employee = this.employeeFactory.createVeterinarian({
            ...baseProps,
            licenseNumber: dto.licenseNumber ?? '',
            expertise: dto.expertise,
          });
          break;
        case UserType.CARE_STAFF:
          employee = this.employeeFactory.createCareStaff({
            ...baseProps,
            skills: dto.skills,
          });
          break;
        case UserType.MANAGER:
          employee = this.employeeFactory.createManager(baseProps);
          break;
        case UserType.RECEPTIONIST:
          employee = this.employeeFactory.createReceptionist(baseProps);
          break;
        default:
          I18nException.forbidden('errors.forbidden.accessDenied');
      }

      return manager.save(employee);
    });
  }

  // ==================== Read ====================

  /**
   * Gets all employees with optional filters.
   */
  async getAll(filters?: {
    role?: UserType;
    available?: boolean;
    fullName?: string;
  }): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.account', 'account');

    if (filters?.role) {
      queryBuilder.andWhere('account.userType = :role', { role: filters.role });
    }

    if (filters?.available !== undefined) {
      queryBuilder.andWhere('employee.isAvailable = :available', {
        available: filters.available,
      });
    }

    if (filters?.fullName) {
      queryBuilder.andWhere('employee.fullName ILIKE :fullName', {
        fullName: `%${filters.fullName}%`,
      });
    }

    return queryBuilder.orderBy('employee.fullName', 'ASC').getMany();
  }

  /**
   * Gets employee by employee ID.
   */
  async getById(employeeId: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee');
    }
    return employee;
  }

  /**
   * Gets employee by account ID.
   */
  async getByAccountId(accountId: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { accountId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee');
    }
    return employee;
  }

  /**
   * Gets employees by role (userType).
   */
  async getByRole(role: UserType): Promise<Employee[]> {
    // Join with Account to filter by userType
    return this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoin('employee.account', 'account')
      .where('account.userType = :role', { role })
      .getMany();
  }

  /**
   * Gets all available employees.
   *
   * NOTE: Kept as a convenience wrapper for older callers/tests.
   */
  async getAvailable(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { isAvailable: true },
    });
  }

  /**
   * Gets all available employees by role.
   *
   * NOTE: Kept as a convenience wrapper for older callers/tests.
   */
  async getAvailableByRole(role: UserType): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoin('employee.account', 'account')
      .where('account.userType = :role', { role })
      .andWhere('employee.isAvailable = :isAvailable', { isAvailable: true })
      .getMany();
  }

  /**
   * Gets available employees with optional date filtering.
   * If date is provided, only returns employees who have availability on that date.
   */
  async getAvailableEmployees(filters?: {
    role?: UserType;
    date?: string;
  }): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.account', 'account')
      .where('employee.isAvailable = :available', { available: true });

    if (filters?.role) {
      queryBuilder.andWhere('account.userType = :role', { role: filters.role });
    }

    if (filters?.date) {
      // Subquery to find employees who are NOT fully booked on the given date
      // An employee is available if they don't have overlapping appointments
      // or have gaps in their schedule
      queryBuilder.andWhere(
        `employee.employeeId NOT IN (
          SELECT DISTINCT a."employeeId"
          FROM appointments a
          WHERE a."appointmentDate" = :date
          AND a.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
          GROUP BY a."employeeId"
          HAVING COUNT(*) >= 10
        )`,
        { date: filters.date },
      );
    }

    return queryBuilder.orderBy('employee.fullName', 'ASC').getMany();
  }

  // ==================== Update ====================

  /**
   * Updates employee (Manager only or self).
   * Combines profile, employment, and role-specific updates.
   */
  async update(
    callerAccountId: number,
    targetEmployeeId: number,
    updates: UpdateEmployeeDto,
  ): Promise<Employee> {
    // Get employee
    const entity = await this.getById(targetEmployeeId);

    // Authorization: Manager can update anyone, employee can update self
    const isSelf = this.isSameEmployee(callerAccountId, entity);
    const isManager = await this.isManager(callerAccountId);

    if (!isSelf && !isManager) {
      I18nException.forbidden('errors.forbidden.accessDenied');
    }

    // Only Manager can change salary
    if (updates.salary !== undefined && !isManager) {
      I18nException.forbidden('errors.forbidden.insufficientPermissions');
    }

    // Only Manager can change licenseNumber (official credential)
    if (updates.licenseNumber !== undefined && !isManager) {
      I18nException.forbidden('errors.forbidden.insufficientPermissions');
    }

    // Convert to domain, update, save
    const domain = EmployeeMapper.toDomain(entity);

    // Update profile fields
    if (
      updates.fullName ||
      updates.phoneNumber ||
      updates.address !== undefined
    ) {
      domain.updateProfile({
        fullName: updates.fullName,
        phoneNumber: updates.phoneNumber,
        address: updates.address,
      });
    }

    // Update employment details (salary)
    if (updates.salary !== undefined) {
      domain.updateEmploymentDetails({ salary: updates.salary });
    }

    // Update availability
    if (updates.isAvailable !== undefined) {
      if (updates.isAvailable) {
        domain.markAvailable();
      } else {
        domain.markUnavailable();
      }
    }

    // Update role-specific fields via domain model (Rich Domain)
    if (domain instanceof VeterinarianDomainModel) {
      if (updates.licenseNumber !== undefined) {
        domain.updateLicenseNumber(updates.licenseNumber);
      }
      if (updates.expertise !== undefined) {
        domain.updateExpertise(updates.expertise);
      }
    }

    if (domain instanceof CareStaffDomainModel) {
      if (updates.skills !== undefined) {
        domain.updateSkills(updates.skills);
      }
    }

    // Save domain changes to entity
    const updated = EmployeeMapper.toPersistence(domain);
    return this.employeeRepository.save(updated);
  }

  /**
   * Marks employee as available.
   */
  async markAvailable(employeeId: number): Promise<Employee> {
    const entity = await this.getById(employeeId);
    const domain = EmployeeMapper.toDomain(entity);
    domain.markAvailable();
    const updated = EmployeeMapper.toPersistence(domain);
    return this.employeeRepository.save(updated);
  }

  /**
   * Marks employee as unavailable.
   */
  async markUnavailable(employeeId: number): Promise<Employee> {
    const entity = await this.getById(employeeId);
    const domain = EmployeeMapper.toDomain(entity);
    domain.markUnavailable();
    const updated = EmployeeMapper.toPersistence(domain);
    return this.employeeRepository.save(updated);
  }

  // ==================== Private Helpers ====================

  /**
   * Verifies caller is a Manager
   */
  private async verifyIsManager(accountId: number): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!account || account.userType !== UserType.MANAGER) {
      I18nException.forbidden('errors.forbidden.insufficientPermissions');
    }
  }

  /**
   * Checks if caller is a Manager
   */
  private async isManager(accountId: number): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    return account?.userType === UserType.MANAGER;
  }

  private isSameEmployee(accountId: number, employee: Employee): boolean {
    return employee.accountId === accountId;
  }

  /**
   * Gets employee availability time slots for a specific date.
   * Returns 30-minute intervals from 8:00 to 17:30, marked as available or booked.
   */
  async getEmployeeAvailability(
    employeeId: number,
    dateStr: string,
  ): Promise<Array<{ time: string; available: boolean; isBooked: boolean }>> {
    // Verify employee exists and is available
    const employee = await this.getById(employeeId);

    if (!employee.isAvailable) {
      // Return all slots as unavailable if employee is not available
      return this.generateTimeSlots().map((time) => ({
        time,
        available: false,
        isBooked: false,
      }));
    }

    // Get all appointments for this employee on this date
    const appointments = await this.appointmentRepository.find({
      where: {
        employeeId,
        appointmentDate: new Date(dateStr),
        status: Between(
          AppointmentStatus.PENDING,
          AppointmentStatus.IN_PROGRESS,
        ) as any, // Active appointments
      },
      select: ['startTime', 'endTime'],
    });

    // Generate time slots and mark which ones are booked
    const timeSlots = this.generateTimeSlots();

    return timeSlots.map((time) => {
      const isBooked = this.isTimeSlotBooked(time, appointments);
      return {
        time,
        available: !isBooked,
        isBooked,
      };
    });
  }

  /**
   * Generates 30-minute time slots from 8:00 to 17:30
   */
  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  /**
   * Checks if a time slot overlaps with any appointment
   */
  private isTimeSlotBooked(
    timeSlot: string,
    appointments: Array<{ startTime: string; endTime: string }>,
  ): boolean {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotMinutes = slotHour * 60 + slotMinute;
    const slotEndMinutes = slotMinutes + 30; // 30-minute slot

    return appointments.some((apt) => {
      const [startHour, startMinute] = apt.startTime.split(':').map(Number);
      const [endHour, endMinute] = apt.endTime.split(':').map(Number);

      const aptStartMinutes = startHour * 60 + startMinute;
      const aptEndMinutes = endHour * 60 + endMinute;

      // Check if slot overlaps with appointment
      return (
        (slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes) ||
        (slotEndMinutes > aptStartMinutes && slotEndMinutes <= aptEndMinutes) ||
        (slotMinutes <= aptStartMinutes && slotEndMinutes >= aptEndMinutes)
      );
    });
  }
}
