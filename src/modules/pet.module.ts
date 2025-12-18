import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetController } from '../controllers/pet.controller';
import { PetService } from '../services/pet.service';
import { Pet } from '../entities/pet.entity';
import { PetOwner } from '../entities/pet-owner.entity';

/**
 * PetModule
 *
 * Manages pet records including create, read, update, and delete (CRUD) operations.
 * Handles pet information including name, species, breed, age, weight, and health condition.
 * Supports multiple pets per owner account and maintains pet-owner relationships.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Pet, PetOwner])],
  controllers: [PetController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
