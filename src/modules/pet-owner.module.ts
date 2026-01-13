import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetOwnerController } from '../controllers/pet-owner.controller';
import { PetOwnerService } from '../services/pet-owner.service';
import { PetOwnerFactory } from '../factories/pet-owner.factory';
import { AccountFactory } from '../factories/account.factory';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Appointment } from '../entities/appointment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Pet } from '../entities/pet.entity';
import { EmailModule } from './email.module';

/**
 * PetOwnerModule
 *
 * Handles PetOwner-specific operations:
 * - Self-registration (public)
 * - Profile management
 * - Contact preferences
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, PetOwner, Appointment, Invoice, Pet]),
    EmailModule,
  ],
  controllers: [PetOwnerController],
  providers: [PetOwnerService, PetOwnerFactory, AccountFactory],
  exports: [PetOwnerService, PetOwnerFactory],
})
export class PetOwnerModule {}
