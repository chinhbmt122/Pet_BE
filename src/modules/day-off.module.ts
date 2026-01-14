import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DayOffController } from '../controllers/day-off.controller';
import { DayOffService } from '../services/day-off.service';
import { DayOff } from '../entities/day-off.entity';

/**
 * DayOffModule
 *
 * Manages day-off/holiday records.
 * Handles creation, retrieval, updates, and deletion of day-off dates.
 * Used for tracking business closure dates and holidays.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DayOff])],
  controllers: [DayOffController],
  providers: [DayOffService],
  exports: [DayOffService],
})
export class DayOffModule {}
