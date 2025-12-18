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
} from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

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
  ): Promise<Appointment> {
    return this.appointmentService.createAppointment(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({
    status: 200,
    description: 'List of all appointments',
    type: [Appointment],
  })
  async getAllAppointments(): Promise<Appointment[]> {
    return this.appointmentService.getAllAppointments();
  }

  @Get('by-status')
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
  @ApiOperation({ summary: 'Get appointments by employee ID' })
  @ApiParam({ name: 'employeeId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of appointments',
    type: [Appointment],
  })
  async getAppointmentsByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<Appointment[]> {
    return this.appointmentService.getAppointmentsByEmployee(employeeId);
  }

  @Get(':id')
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
  ): Promise<Appointment> {
    return this.appointmentService.getAppointmentById(id);
  }

  @Put(':id')
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
  ): Promise<Appointment> {
    return this.appointmentService.cancelAppointment(id, reason);
  }
}
