import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { UserType } from '../entities/types/entity.types';
import { AccountFactory } from '../factories/account.factory';
import { PetOwnerFactory } from '../factories/pet-owner.factory';
import { PetOwnerMapper } from '../mappers/pet-owner.mapper';
import { RegisterPetOwnerDto, UpdatePetOwnerDto } from '../dto/pet-owner';

/**
 * PetOwnerService
 *
 * Handles PetOwner-specific operations:
 * - Self-registration (public endpoint)
 * - Profile management
 * - Preferences
 */
@Injectable()
export class PetOwnerService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        @InjectRepository(PetOwner)
        private readonly petOwnerRepository: Repository<PetOwner>,
        private readonly accountFactory: AccountFactory,
        private readonly petOwnerFactory: PetOwnerFactory,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Registers a new PetOwner (self-registration, public).
     *
     * Flow:
     * 1. Create Account entity (auth only) via AccountFactory
     * 2. Save Account to get accountId
     * 3. Create PetOwner entity (profile) via PetOwnerFactory
     * 4. Save PetOwner linked to Account
     * 5. Return created PetOwner
     *
     * Uses transaction to ensure atomicity.
     */
    async register(dto: RegisterPetOwnerDto): Promise<PetOwner> {
        // Use transaction for atomicity
        return this.dataSource.transaction(async (manager) => {
            // 1. Create Account via factory (validates email uniqueness)
            const account = await this.accountFactory.create(
                dto.email,
                dto.password,
                UserType.PET_OWNER,
            );

            // 2. Save Account
            const savedAccount = await manager.save(Account, account);

            // 3. Create PetOwner via factory
            const petOwner = this.petOwnerFactory.create({
                accountId: savedAccount.accountId,
                fullName: dto.fullName,
                phoneNumber: dto.phoneNumber,
                address: dto.address ?? null,
                preferredContactMethod: dto.preferredContactMethod,
                emergencyContact: dto.emergencyContact,
            });

            // 4. Save PetOwner
            const savedPetOwner = await manager.save(PetOwner, petOwner);

            return savedPetOwner;
        });
    }

    /**
     * Gets PetOwner by account ID.
     */
    async getByAccountId(accountId: number): Promise<PetOwner> {
        const petOwner = await this.petOwnerRepository.findOne({
            where: { accountId },
        });
        if (!petOwner) {
            throw new NotFoundException('PetOwner not found');
        }
        return petOwner;
    }

    /**
     * Updates PetOwner profile.
     * Uses domain model for business logic.
     */
    async updateProfile(
        accountId: number,
        updates: {
            fullName?: string;
            phoneNumber?: string;
            address?: string | null;
        },
    ): Promise<PetOwner> {
        // 1. Find entity
        const entity = await this.petOwnerRepository.findOne({
            where: { accountId },
        });
        if (!entity) {
            throw new NotFoundException('PetOwner not found');
        }

        // 2. Convert to domain model
        const domain = PetOwnerMapper.toDomain(entity);

        // 3. Update via domain model
        domain.updateProfile(updates);

        // 4. Convert back and save
        const updated = PetOwnerMapper.toPersistence(domain);
        return this.petOwnerRepository.save(updated);
    }

    /**
     * Updates PetOwner preferences.
     */
    async updatePreferences(
        accountId: number,
        updates: {
            preferredContactMethod?: string;
            emergencyContact?: string | null;
        },
    ): Promise<PetOwner> {
        // 1. Find entity
        const entity = await this.petOwnerRepository.findOne({
            where: { accountId },
        });
        if (!entity) {
            throw new NotFoundException('PetOwner not found');
        }

        // 2. Convert to domain model
        const domain = PetOwnerMapper.toDomain(entity);

        // 3. Update via domain model
        domain.updateContactPreferences(updates);

        // 4. Convert back and save
        const updated = PetOwnerMapper.toPersistence(domain);
        return this.petOwnerRepository.save(updated);
    }
}
