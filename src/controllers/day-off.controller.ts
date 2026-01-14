import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DayOffService } from '../services/day-off.service';
import {
  CreateDayOffDto,
  UpdateDayOffDto,
  DayOffResponseDto,
} from '../dto/day-off';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

/**
 * DayOffController
 *
 * Manages day-off/holiday endpoints.
 */
@ApiTags('Day Off')
@Controller('api/day-offs')
export class DayOffController {
  constructor(private readonly dayOffService: DayOffService) {}

  /**
   * POST /api/day-offs
   * Creates a new day-off record.
   */
  @Post()
  @RouteConfig({
    message: 'Create day off (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create day off' })
  @ApiResponse({
    status: 201,
    description: 'Day off created',
    type: DayOffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 409,
    description: 'Day off already exists for this date',
  })
  async createDayOff(@Body() dto: CreateDayOffDto): Promise<DayOffResponseDto> {
    return this.dayOffService.createDayOff(dto);
  }

  /**
   * GET /api/day-offs
   * Retrieves all day-offs or filtered by date range.
   */
  @Get()
  @RouteConfig({
    message: 'Get all day offs',
    requiresAuth: false,
    roles: [
      UserType.MANAGER,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
      UserType.RECEPTIONIST,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all day offs or filter by date range' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO 8601)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO 8601)',
    example: '2026-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'List of day offs',
    type: [DayOffResponseDto],
  })
  async getAllDayOffs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DayOffResponseDto[]> {
    if (startDate && endDate) {
      return this.dayOffService.getDayOffsByDateRange(startDate, endDate);
    }
    return this.dayOffService.getAllDayOffs();
  }

  /**
   * GET /api/day-offs/:id
   * Retrieves a day-off by ID.
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get day off by ID',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
      UserType.RECEPTIONIST,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get day off by ID' })
  @ApiParam({ name: 'id', description: 'Day off ID' })
  @ApiResponse({
    status: 200,
    description: 'Day off details',
    type: DayOffResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Day off not found' })
  async getDayOffById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DayOffResponseDto> {
    return this.dayOffService.getDayOffById(id);
  }

  /**
   * PUT /api/day-offs/:id
   * Updates an existing day-off record.
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update day off (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update day off' })
  @ApiParam({ name: 'id', description: 'Day off ID' })
  @ApiResponse({
    status: 200,
    description: 'Day off updated',
    type: DayOffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Day off not found' })
  @ApiResponse({ status: 409, description: 'Day off conflict' })
  async updateDayOff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDayOffDto,
  ): Promise<DayOffResponseDto> {
    return this.dayOffService.updateDayOff(id, dto);
  }

  /**
   * DELETE /api/day-offs/:id
   * Deletes a day-off record.
   */
  @Delete(':id')
  @RouteConfig({
    message: 'Delete day off (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete day off' })
  @ApiParam({ name: 'id', description: 'Day off ID' })
  @ApiResponse({ status: 200, description: 'Day off deleted' })
  @ApiResponse({ status: 404, description: 'Day off not found' })
  async deleteDayOff(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dayOffService.deleteDayOff(id);
  }

  /**
   * GET /api/day-offs/check/:date
   * Checks if a specific date is a day-off.
   */
  @Get('check/:date')
  @RouteConfig({
    message: 'Check if date is a day off',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
      UserType.RECEPTIONIST,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a date is a day off' })
  @ApiParam({
    name: 'date',
    description: 'Date to check (ISO 8601)',
    example: '2026-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns boolean indicating if date is a day off',
    schema: { type: 'object', properties: { isDayOff: { type: 'boolean' } } },
  })
  async checkDayOff(
    @Param('date') date: string,
  ): Promise<{ isDayOff: boolean }> {
    const isDayOff = await this.dayOffService.isDayOff(date);
    return { isDayOff };
  }
}
