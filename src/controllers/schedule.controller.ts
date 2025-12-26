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
import { ScheduleService } from '../services/schedule.service';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  WorkScheduleResponseDto,
} from '../dto/schedule';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { Account, UserType } from '../entities/account.entity';
import { GetUser } from '../middleware/decorators/user.decorator';

/**
 * ScheduleController
 *
 * Manages staff schedule and availability endpoints.
 */
@ApiTags('Schedule')
@Controller('api/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * POST /api/schedules
   * Creates new work schedule for an employee.
   */
  @Post()
  @RouteConfig({
    message: 'Create work schedule (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create work schedule' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created',
    type: WorkScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Schedule conflict' })
  async createSchedule(
    @Body() dto: CreateWorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.createSchedule(dto);
  }

  /**
   * GET /api/schedules/:id
   * Retrieves schedule by ID.
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get schedule by ID',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
      UserType.RECEPTIONIST,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved',
    type: WorkScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async getScheduleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.getScheduleById(id);
  }

  /**
   * GET /api/schedules
   * Retrieves all schedules with optional filters.
   */
  @Get()
  @RouteConfig({
    message: 'Get all schedules',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all schedules' })
  @ApiQuery({
    name: 'onlyAvailable',
    required: false,
    type: Boolean,
    description: 'Filter by available only',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved',
    type: [WorkScheduleResponseDto],
  })
  async getAllSchedules(
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WorkScheduleResponseDto[]> {
    return this.scheduleService.getAllSchedules({
      onlyAvailable: onlyAvailable === 'true',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * GET /api/schedules/employee/:employeeId
   * Retrieves employee schedules for optional date range.
   * VET/CARE_STAFF can only view their own schedules.
   */
  @Get('employee/:employeeId')
  @RouteConfig({
    message: 'Get schedules by employee',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.RECEPTIONIST,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get schedules by employee' })
  @ApiParam({ name: 'employeeId', type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved',
    type: [WorkScheduleResponseDto],
  })
  async getSchedulesByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @GetUser() user: Account,
  ): Promise<WorkScheduleResponseDto[]> {
    return this.scheduleService.getSchedulesByEmployee(
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      user,
    );
  }

  /**
   * GET /api/schedules/date/:date
   * Gets all employee schedules for a specific date.
   */
  @Get('date/:date')
  @RouteConfig({
    message: 'Get schedules by date',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get schedules by date' })
  @ApiParam({
    name: 'date',
    type: String,
    description: 'Date in YYYY-MM-DD format',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved',
    type: [WorkScheduleResponseDto],
  })
  async getSchedulesByDate(
    @Param('date') date: string,
  ): Promise<WorkScheduleResponseDto[]> {
    return this.scheduleService.getSchedulesByDate(new Date(date));
  }

  /**
   * PUT /api/schedules/:id
   * Updates existing schedule.
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update schedule (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update schedule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated',
    type: WorkScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.updateSchedule(id, dto);
  }

  /**
   * DELETE /api/schedules/:id
   * Removes schedule.
   */
  @Delete(':id')
  @RouteConfig({
    message: 'Delete schedule (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Schedule deleted' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async deleteSchedule(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    const result = await this.scheduleService.deleteSchedule(id);
    return { deleted: result };
  }

  /**
   * GET /api/schedules/availability/check
   * Checks if employee is available at specific date/time.
   */
  @Get('availability/check')
  @RouteConfig({
    message: 'Check availability (for booking)',
    requiresAuth: false, // Public for scheduling appointments
  })
  @ApiOperation({ summary: 'Check availability' })
  @ApiQuery({ name: 'employeeId', required: true, type: Number })
  @ApiQuery({
    name: 'dateTime',
    required: true,
    type: String,
    description: 'ISO date-time string',
  })
  @ApiResponse({ status: 200, description: 'Availability checked' })
  async checkAvailability(
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Query('dateTime') dateTime: string,
  ): Promise<{ available: boolean }> {
    const available = await this.scheduleService.checkAvailability(
      employeeId,
      new Date(dateTime),
    );
    return { available };
  }

  /**
   * GET /api/schedules/available-employees
   * Gets all available employees for a specific date/time range.
   */
  @Get('available-employees')
  @ApiOperation({ summary: 'Get available employees' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'startTime',
    required: false,
    type: String,
    description: 'Start time in HH:mm format',
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    type: String,
    description: 'End time in HH:mm format',
  })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Available employees retrieved' })
  async getAvailableEmployees(
    @Query('date') date: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('role') role?: string,
  ): Promise<any[]> {
    return this.scheduleService.getAvailableEmployees({
      date: new Date(date),
      startTime,
      endTime,
      role,
    });
  }

  /**
   * PUT /api/schedules/:id/break
   * Assigns break time to schedule.
   */
  @Put(':id/break')
  @RouteConfig({
    message: 'Assign break time',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign break time' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Break assigned',
    type: WorkScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async assignBreakTime(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { breakStart: string; breakEnd: string },
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.assignBreakTime(
      id,
      body.breakStart,
      body.breakEnd,
    );
  }

  /**
   * PUT /api/schedules/:id/unavailable
   * Marks schedule as unavailable.
   */
  @Put(':id/unavailable')
  @RouteConfig({
    message: 'Mark schedule unavailable',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.CARE_STAFF],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark schedule unavailable' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Schedule marked unavailable',
    type: WorkScheduleResponseDto,
  })
  async markUnavailable(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.markUnavailable(id, body.reason);
  }

  /**
   * PUT /api/schedules/:id/available
   * Marks schedule as available.
   */
  @Put(':id/available')
  @RouteConfig({
    message: 'Mark schedule available',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.CARE_STAFF],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark schedule available' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Schedule marked available',
    type: WorkScheduleResponseDto,
  })
  async markAvailable(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkScheduleResponseDto> {
    return this.scheduleService.markAvailable(id);
  }
}
