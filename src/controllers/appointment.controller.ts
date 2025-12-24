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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

/**
 * AppointmentController
 *
 * Manages appointment booking, status transitions, and queries.
 * Routes: /api/appointments
 */
@ApiTags('Appointment Management')
@Controller('api/appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  @Post()
  @RouteConfig({
    message: 'Create new appointment',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created',
    type: Appointment,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 404,
    description: 'Pet, employee, or service not found',
  })
  @ApiResponse({ status: 409, description: 'Schedule conflict' })
  async createAppointment(
    @Body() dto: CreateAppointmentDto,
    @Req() req: any,
  ): Promise<Appointment> {
    const user = req.user;
    return this.appointmentService.createAppointment(dto, user);
  }

  @Get()
  @RouteConfig({
    message: 'Get all appointments',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({
    status: 200,
    description: 'List of all appointments',
    type: [Appointment],
  })
  async getAllAppointments(@Req() req: any): Promise<Appointment[]> {
    const user = req.user;
    return this.appointmentService.getAllAppointments(user);
  }

  @Get('by-status')
  @RouteConfig({
    message: 'Get appointments by status',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments by status' })
  @ApiQuery({ name: 'status', enum: AppointmentStatus })
  @ApiResponse({
    status: 200,
    description: 'List of appointments',
    type: [Appointment],
  })
  async getAppointmentsByStatus(
    @Query('status') status: AppointmentStatus,
  ): Promise<Appointment[]> {
    return this.appointmentService.getAppointmentsByStatus(status);
  }

  @Get('by-pet/:petId')
  @RouteConfig({
    message: 'Get appointments by pet ID',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.VETERINARIAN, UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments by pet ID' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of appointments',
    type: [Appointment],
  })
  async getAppointmentsByPet(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<Appointment[]> {
    return this.appointmentService.getAppointmentsByPet(petId);
  }

  @Get('by-employee/:employeeId')
  @RouteConfig({
    message: 'Get appointments by employee ID',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.CARE_STAFF, UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments by employee ID' })
  @ApiParam({ name: 'employeeId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of appointments',
    type: [Appointment],
  })
  async getAppointmentsByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Req() req: any,
  ): Promise<Appointment[]> {
    const user = req.user;
    return this.appointmentService.getAppointmentsByEmployee(employeeId, user);
  }

  @Get(':id')
  @RouteConfig({
    message: 'Get appointment by ID',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER, UserType.VETERINARIAN, UserType.CARE_STAFF],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment retrieved',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getAppointmentById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<Appointment> {
    const user = req.user;
    return this.appointmentService.getAppointmentById(id, user);
  }

  @Put(':id')
  @RouteConfig({
    message: 'Update appointment details',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.updateAppointment(id, dto);
  }

  @Delete(':id')
  @RouteConfig({
    message: 'Delete appointment (only if pending)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete appointment (only if pending)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Appointment deleted' })
  @ApiResponse({
    status: 400,
    description: 'Can only delete pending appointments',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async deleteAppointment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.appointmentService.deleteAppointment(id);
    return { message: 'Appointment deleted successfully' };
  }

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  @Put(':id/confirm')
  @RouteConfig({
    message: 'Confirm appointment (PENDING → CONFIRMED)',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm appointment (PENDING → CONFIRMED)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment confirmed',
    type: Appointment,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only confirm pending appointments',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async confirmAppointment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Appointment> {
    return this.appointmentService.confirmAppointment(id);
  }

  @Put(':id/start')
  @RouteConfig({
    message: 'Start appointment (CONFIRMED → IN_PROGRESS)',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.CARE_STAFF, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start appointment (CONFIRMED → IN_PROGRESS)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment started',
    type: Appointment,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only start confirmed appointments',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async startAppointment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Appointment> {
    return this.appointmentService.startAppointment(id);
  }

  @Put(':id/complete')
  @RouteConfig({
    message: 'Complete appointment (IN_PROGRESS → COMPLETED)',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.CARE_STAFF, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete appointment (IN_PROGRESS → COMPLETED)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed',
    type: Appointment,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only complete in-progress appointments',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async completeAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body('actualCost') actualCost?: number,
  ): Promise<Appointment> {
    return this.appointmentService.completeAppointment(id, actualCost);
  }

  @Put(':id/cancel')
  @RouteConfig({
    message: 'Cancel appointment (any status → CANCELLED)',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel appointment (any status → CANCELLED)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled',
    type: Appointment,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel completed appointments',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
    @Req() req?: any,
  ): Promise<Appointment> {
    const user = req?.user;
    return this.appointmentService.cancelAppointment(id, reason, user);
  }
}
