import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoryController } from '../controllers/service-category.controller';
import { ServiceCategoryService } from '../services/service-category.service';
import { ServiceCategory } from '../entities/service-category.entity';

/**
 * ServiceCategoryModule
 *
 * Manages service categories (Grooming, Medical, Boarding, etc.)
 */
@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategory])],
  controllers: [ServiceCategoryController],
  providers: [ServiceCategoryService],
  exports: [ServiceCategoryService],
})
export class ServiceCategoryModule {}
