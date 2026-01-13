import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetOwner } from '../../entities/pet-owner.entity';
import { Pet } from '../../entities/pet.entity';
import { UserType } from '../../entities/account.entity';
import { I18nException } from '../../utils/i18n-exception.util';

/**
 * User context for authorization checks.
 */
export interface UserContext {
  accountId: number;
  userType: UserType;
}

/**
 * OwnershipValidationHelper
 *
 * Shared helper service for validating pet ownership across all services.
 * Centralizes the logic to avoid duplication in appointment, invoice, payment,
 * medical-record, and pet services.
 *
 * @refactored Phase 1 - Extracted from duplicated code across 8 services
 */
@Injectable()
export class OwnershipValidationHelper {
  constructor(
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  /**
   * Gets the PetOwner entity for a user account.
   * @throws NotFoundException if user is PET_OWNER but no owner record exists
   */
  async getPetOwnerByAccount(accountId: number): Promise<PetOwner | null> {
    return this.petOwnerRepository.findOne({
      where: { accountId },
    });
  }

  /**
   * Validates that a PET_OWNER user owns the specified pet.
   * Staff users (VET, RECEPTIONIST, etc.) bypass ownership checks.
   *
   * @param petId - The pet ID to validate ownership for
   * @param user - The user context (optional, skipped if null)
   * @throws NotFoundException if pet not found or ownership validation fails
   * @returns The validated Pet entity
   */
  async validatePetOwnership(petId: number, user?: UserContext): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { petId },
    });

    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: petId });
      throw new NotFoundException(`Pet not found`);
    }

    // Only validate ownership for PET_OWNER users
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.getPetOwnerByAccount(user.accountId);

      if (!petOwner) {
        I18nException.notFound('errors.notFound.owner');
        throw new NotFoundException(`Owner not found`);
      }

      if (pet.ownerId !== petOwner.petOwnerId) {
        // Pet exists but user doesn't own it - return "not found" for security
        I18nException.notFound('errors.notFound.pet', { id: petId });
      }
    }

    return pet;
  }

  /**
   * Validates ownership through an appointment's pet.
   * Useful for invoice/payment services that access pets via appointments.
   *
   * @param appointment - The appointment containing the pet relation
   * @param user - The user context
   * @throws NotFoundException if ownership validation fails
   */
  async validateAppointmentOwnership(
    appointment: { pet?: { ownerId?: number } },
    user?: UserContext,
  ): Promise<void> {
    if (!user || user.userType !== UserType.PET_OWNER) {
      return; // Staff users bypass ownership checks
    }

    if (!appointment.pet) {
      return; // No pet relation loaded, skip validation
    }

    const petOwner = await this.getPetOwnerByAccount(user.accountId);
    if (!petOwner || appointment.pet.ownerId !== petOwner.petOwnerId) {
      I18nException.notFound('errors.notFound.resource');
    }
  }

  /**
   * Checks if a user owns a specific pet (returns boolean, doesn't throw).
   * Useful for filtering queries.
   */
  async userOwnsPet(petId: number, accountId: number): Promise<boolean> {
    const petOwner = await this.getPetOwnerByAccount(accountId);
    if (!petOwner) {
      return false;
    }

    const pet = await this.petRepository.findOne({
      where: { petId },
    });

    return pet?.ownerId === petOwner.petOwnerId;
  }
}
