import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../entities/system-config.entity';
import { I18nException } from '../utils/i18n-exception.util';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
} from '../dto/config';

/**
 * SystemConfigService
 *
 * Manages system-wide configuration including persistent day-off rules.
 * Provides methods to check if specific days are persistent off days.
 */
@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
  ) {}

  /**
   * Creates a new system configuration.
   */
  async createConfig(
    dto: CreateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    // Check if config key already exists
    const existing = await this.configRepository.findOne({
      where: { configKey: dto.configKey },
    });

    if (existing) {
      I18nException.conflict('errors.conflict.configExists', {
        key: dto.configKey,
      });
    }

    // Validate JSON format for configValue
    try {
      JSON.parse(dto.configValue);
    } catch {
      I18nException.badRequest('validation.custom.invalidJson', {
        field: 'configValue',
      });
    }

    const config = this.configRepository.create({
      configKey: dto.configKey,
      configValue: dto.configValue,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.configRepository.save(config);
    return this.mapToResponseDto(saved);
  }

  /**
   * Retrieves a configuration by key.
   */
  async getConfigByKey(configKey: string): Promise<SystemConfigResponseDto> {
    const config = await this.configRepository.findOne({
      where: { configKey },
    });

    if (!config) {
      I18nException.notFound('errors.notFound.config', { key: configKey });
    }

    return this.mapToResponseDto(config);
  }

  /**
   * Retrieves all system configurations.
   */
  async getAllConfigs(): Promise<SystemConfigResponseDto[]> {
    const configs = await this.configRepository.find({
      order: { configKey: 'ASC' },
    });

    return configs.map((config) => this.mapToResponseDto(config));
  }

  /**
   * Updates a system configuration.
   */
  async updateConfig(
    configId: number,
    dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    const config = await this.configRepository.findOne({
      where: { configId },
    });

    if (!config) {
      I18nException.notFound('errors.notFound.config', { id: configId });
    }

    // If updating configValue, validate JSON
    if (dto.configValue) {
      try {
        JSON.parse(dto.configValue);
      } catch {
        I18nException.badRequest('validation.custom.invalidJson', {
          field: 'configValue',
        });
      }
    }

    // Check for key uniqueness if updating key
    if (dto.configKey && dto.configKey !== config.configKey) {
      const existing = await this.configRepository.findOne({
        where: { configKey: dto.configKey },
      });
      if (existing) {
        I18nException.conflict('errors.conflict.configExists', {
          key: dto.configKey,
        });
      }
    }

    Object.assign(config, dto);
    const updated = await this.configRepository.save(config);
    return this.mapToResponseDto(updated);
  }

  /**
   * Deletes a system configuration.
   */
  async deleteConfig(configId: number): Promise<void> {
    const config = await this.configRepository.findOne({
      where: { configId },
    });

    if (!config) {
      I18nException.notFound('errors.notFound.config', { id: configId });
    }

    await this.configRepository.remove(config);
  }

  /**
   * Checks if a given date falls on a persistent day off.
   * @param date - Date to check
   * @returns true if the date is a persistent day off
   */
  async isPersistentDayOff(date: Date): Promise<boolean> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'persistent_days_off', isActive: true },
      });

      if (!config) {
        return false; // No persistent day off configuration
      }

      const daysOff = JSON.parse(config.configValue) as number[];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      return daysOff.includes(dayOfWeek);
    } catch (error) {
      // If there's an error parsing or retrieving config, assume no restrictions
      console.error('Error checking persistent day off:', error);
      return false;
    }
  }

  /**
   * Gets the list of persistent day off numbers (0=Sunday, 6=Saturday).
   * @returns Array of day numbers that are persistent days off
   */
  async getPersistentDaysOff(): Promise<number[]> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'persistent_days_off', isActive: true },
      });

      if (!config) {
        return [];
      }

      return JSON.parse(config.configValue) as number[];
    } catch (error) {
      console.error('Error getting persistent days off:', error);
      return [];
    }
  }

  /**
   * Sets the persistent days off configuration.
   * @param daysOff - Array of day numbers (0=Sunday, 6=Saturday)
   */
  async setPersistentDaysOff(
    daysOff: number[],
  ): Promise<SystemConfigResponseDto> {
    // Validate day numbers
    if (!Array.isArray(daysOff) || daysOff.some((day) => day < 0 || day > 6)) {
      I18nException.badRequest('validation.custom.invalidDayNumbers', {
        valid: '0-6',
      });
    }

    const configKey = 'persistent_days_off';
    const existing = await this.configRepository.findOne({
      where: { configKey },
    });

    if (existing) {
      // Update existing configuration
      existing.configValue = JSON.stringify(daysOff);
      const updated = await this.configRepository.save(existing);
      return this.mapToResponseDto(updated);
    } else {
      // Create new configuration
      const config = this.configRepository.create({
        configKey,
        configValue: JSON.stringify(daysOff),
        description:
          'Days of the week that are always off (0=Sunday, 6=Saturday)',
        isActive: true,
      });
      const saved = await this.configRepository.save(config);
      return this.mapToResponseDto(saved);
    }
  }

  /**
   * Maps entity to response DTO.
   */
  private mapToResponseDto(config: SystemConfig): SystemConfigResponseDto {
    return {
      configId: config.configId,
      configKey: config.configKey,
      configValue: config.configValue,
      description: config.description,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
