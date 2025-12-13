import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account } from '../entities/account.entity';
import { UserType } from '../entities/types/entity.types';
import { PetOwner } from '../entities/pet-owner.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';

/**
 * Base DTO for account creation
 * Contains required fields for all account types
 */
interface BaseAccountDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    address?: string;
}

/**
 * AccountFactory
 *
 * Centralized factory for creating different account types.
 * Uses separate methods per type (OCP compliant) instead of switch statement.
 *
 * Features:
 * - Password hashing with bcrypt
 * - Email/phone uniqueness validation (app-level + DB constraint)
 * - Required field validation
 * - Type-specific entity creation
 *
 * @see Story 1-3: Account Factory Implementation
 */
@Injectable()
export class AccountFactory {
    private readonly SALT_ROUNDS = 10;

    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
    ) { }

    /**
     * Validates that email and phone number are unique.
     * Provides user-friendly error messages before hitting DB constraint.
     */
    private async validateUniqueness(email: string, phoneNumber: string): Promise<void> {
        const existingEmail = await this.accountRepository.findOne({
            where: { email: email.toLowerCase() },
        });
        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        const existingPhone = await this.accountRepository.findOne({
            where: { phoneNumber },
        });
        if (existingPhone) {
            throw new ConflictException('Phone number already exists');
        }
    }

    /**
       * Creates a PetOwner account with associated PetOwner entity
       */
    async createPetOwnerAccount(
        dto: BaseAccountDto & {
            preferredContactMethod?: string;
            emergencyContact?: string;
        },
    ): Promise<{ account: Account; petOwner: PetOwner }> {
        const account = await this.buildAccount(dto, UserType.PET_OWNER);
        const petOwner = new PetOwner();
        petOwner.preferredContactMethod = dto.preferredContactMethod || 'Email';
        petOwner.emergencyContact = dto.emergencyContact ?? '';
        return { account, petOwner };
    }

    /**
     * Creates a Veterinarian account with associated Veterinarian entity
     */
    async createVeterinarianAccount(
        dto: BaseAccountDto & {
            hireDate: Date;
            salary: number;
            licenseNumber: string;
            expertise?: string;
        },
    ): Promise<{ account: Account; employee: Veterinarian }> {
        const account = await this.buildAccount(dto, UserType.VETERINARIAN);
        const employee = new Veterinarian();
        employee.hireDate = dto.hireDate;
        employee.salary = dto.salary;
        employee.licenseNumber = dto.licenseNumber;
        employee.expertise = dto.expertise ?? '';
        employee.isAvailable = true;
        return { account, employee };
    }

    /**
     * Creates a CareStaff account with associated CareStaff entity
     */
    async createCareStaffAccount(
        dto: BaseAccountDto & {
            hireDate: Date;
            salary: number;
            skills?: string[];
        },
    ): Promise<{ account: Account; employee: CareStaff }> {
        const account = await this.buildAccount(dto, UserType.CARE_STAFF);
        const employee = new CareStaff();
        employee.hireDate = dto.hireDate;
        employee.salary = dto.salary;
        employee.skills = dto.skills || [];
        employee.isAvailable = true;
        return { account, employee };
    }

    /**
     * Creates a Manager account with associated Manager entity
     */
    async createManagerAccount(
        dto: BaseAccountDto & {
            hireDate: Date;
            salary: number;
        },
    ): Promise<{ account: Account; employee: Manager }> {
        const account = await this.buildAccount(dto, UserType.MANAGER);
        const employee = new Manager();
        employee.hireDate = dto.hireDate;
        employee.salary = dto.salary;
        employee.isAvailable = true;
        return { account, employee };
    }

    /**
     * Creates a Receptionist account with associated Receptionist entity
     */
    async createReceptionistAccount(
        dto: BaseAccountDto & {
            hireDate: Date;
            salary: number;
        },
    ): Promise<{ account: Account; employee: Receptionist }> {
        const account = await this.buildAccount(dto, UserType.RECEPTIONIST);
        const employee = new Receptionist();
        employee.hireDate = dto.hireDate;
        employee.salary = dto.salary;
        employee.isAvailable = true;
        return { account, employee };
    }

    /**
     * Builds the base Account entity with password hashing and validation
     *
     * @param dto - Base account data
     * @param userType - The type of user being created
     * @throws Error if required fields are missing
     */
    private async buildAccount(
        dto: BaseAccountDto,
        userType: UserType,
    ): Promise<Account> {
        // Validate required fields
        if (!dto.email || !dto.password || !dto.fullName || !dto.phoneNumber) {
            throw new Error('Missing required account fields');
        }

        // Validate email/phone uniqueness (app-level check before DB constraint)
        await this.validateUniqueness(dto.email, dto.phoneNumber);

        const account = new Account();
        account.email = dto.email.toLowerCase();
        account.passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
        account.fullName = dto.fullName;
        account.phoneNumber = dto.phoneNumber;
        account.address = dto.address ?? '';
        account.userType = userType;
        account.isActive = true;

        return account;
    }
}
