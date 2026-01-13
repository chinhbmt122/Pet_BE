import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetOwner } from '../entities/pet-owner.entity';
import { Pet } from '../entities/pet.entity';
import { OwnershipValidationHelper } from '../services/helpers/ownership-validation.helper';

/**
 * SharedHelpersModule
 *
 * Provides shared helper services that can be used across multiple modules.
 * Marked as @Global so it doesn't need to be imported in every module.
 *
 * Helpers included:
 * - OwnershipValidationHelper: Validates pet ownership for PET_OWNER users
 *
 * @refactored Phase 1 - Centralized ownership validation to reduce duplication
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PetOwner, Pet])],
  providers: [OwnershipValidationHelper],
  exports: [OwnershipValidationHelper],
})
export class SharedHelpersModule {}
