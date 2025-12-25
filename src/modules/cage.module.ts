import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CageController } from '../controllers/cage.controller';
import { CageService } from '../services/cage.service';
import { Cage } from '../entities/cage.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';

/**
 * CageModule
 *
 * Handles Cage and Boarding operations:
 * - Cage CRUD operations
 * - Pet check-in/check-out (cage assignments)
 * - Cage availability management
 * - Maintenance mode handling
 * - Cage reservations
 */
@Module({
  imports: [TypeOrmModule.forFeature([Cage, CageAssignment, Pet, Employee])],
  controllers: [CageController],
  providers: [CageService],
  exports: [CageService],
})
export class CageModule {}
