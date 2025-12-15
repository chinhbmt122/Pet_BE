import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from '../controllers/service.controller';
import { ServiceService } from '../services/service.service';
import { Service } from '../entities/service.entity';
import { ServiceCategory } from '../entities/service-category.entity';

/**
 * ServiceModule
 *
 * Manages service catalog including add, remove, and update operations.
 * Handles five service types: Bathing, Spa, Grooming, Check-up (Veterinary), and Vaccination.
 * Updates service pricing and duration.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceCategory])],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
