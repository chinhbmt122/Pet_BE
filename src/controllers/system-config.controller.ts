import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SystemConfigService } from '../services/system-config.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
} from '../dto/config';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

@ApiTags('System Configuration')
@Controller('api/system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Post()
  @RouteConfig({
    message: 'Create system configuration (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new system configuration (Manager only)' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
    type: SystemConfigResponseDto,
  })
  async createConfig(
    @Body() dto: CreateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    return this.configService.createConfig(dto);
  }

  @Get()
  @RouteConfig({
    message: 'Get all system configurations',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all system configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of all configurations',
    type: [SystemConfigResponseDto],
  })
  async getAllConfigs(): Promise<SystemConfigResponseDto[]> {
    return this.configService.getAllConfigs();
  }

  @Get('key/:key')
  @RouteConfig({
    message: 'Get configuration by key',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    type: SystemConfigResponseDto,
  })
  async getConfigByKey(
    @Param('key') key: string,
  ): Promise<SystemConfigResponseDto> {
    return this.configService.getConfigByKey(key);
  }

  @Get('persistent-days-off')
  @RouteConfig({
    message: 'Get persistent days off',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.RECEPTIONIST,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get persistent days off (0=Sunday, 6=Saturday)' })
  @ApiResponse({
    status: 200,
    description: 'Array of day numbers that are persistent days off',
    type: [Number],
  })
  async getPersistentDaysOff(): Promise<number[]> {
    return this.configService.getPersistentDaysOff();
  }

  @Put('persistent-days-off')
  @RouteConfig({
    message: 'Set persistent days off (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set persistent days off (Manager only)' })
  @ApiResponse({
    status: 200,
    description: 'Persistent days off updated successfully',
    type: SystemConfigResponseDto,
  })
  async setPersistentDaysOff(
    @Body() body: { daysOff: number[] },
  ): Promise<SystemConfigResponseDto> {
    return this.configService.setPersistentDaysOff(body.daysOff);
  }

  @Put(':id')
  @RouteConfig({
    message: 'Update system configuration (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a system configuration (Manager only)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: SystemConfigResponseDto,
  })
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    return this.configService.updateConfig(id, dto);
  }

  @Delete(':id')
  @RouteConfig({
    message: 'Delete system configuration (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a system configuration (Manager only)' })
  @ApiResponse({
    status: 204,
    description: 'Configuration deleted successfully',
  })
  async deleteConfig(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.configService.deleteConfig(id);
  }
}
