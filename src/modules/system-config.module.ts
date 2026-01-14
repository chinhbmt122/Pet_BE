import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from '../entities/system-config.entity';
import { SystemConfigService } from '../services/system-config.service';
import { SystemConfigController } from '../controllers/system-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService], // Export for use in other modules
})
export class SystemConfigModule {}
