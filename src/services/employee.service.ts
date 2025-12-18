import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';
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
      throw new ForbiddenException(
        'Cannot create PetOwner via EmployeeService',
      );
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
          throw new ForbiddenException(
            `Unknown employee type: ${dto.userType}`,
          );
      }

      return manager.save(employee);
    });
  }

  // ==================== Read ====================

  /**
   * Gets all employees.
   */
  async getAll(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  /**
   * Gets employee by employee ID.
   */
  async getById(employeeId: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
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
      throw new NotFoundException('Employee not found');
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
   * Gets available employees.
   */
  async getAvailable(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { isAvailable: true },
    });
  }

  /**
   * Gets available employees by role.
   */
  async getAvailableByRole(role: UserType): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoin('employee.account', 'account')
      .where('account.userType = :role', { role })
      .andWhere('employee.isAvailable = :isAvailable', { isAvailable: true })
      .getMany();
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
      throw new ForbiddenException('Not authorized to update this employee');
    }

    // Only Manager can change salary
    if (updates.salary !== undefined && !isManager) {
      throw new ForbiddenException('Only Managers can change salary');
    }

    // Only Manager can change licenseNumber (official credential)
    if (updates.licenseNumber !== undefined && !isManager) {
      throw new ForbiddenException('Only Managers can update license number');
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
      throw new ForbiddenException('Only Managers can perform this action');
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
}
