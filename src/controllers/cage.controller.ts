import {
  Controller,
  Get,
  Post,
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
import { CageService } from '../services/cage.service';
import { CreateCageDto, UpdateCageDto, AssignCageDto } from '../dto/cage';
import { Cage } from '../entities/cage.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';

/**
 * CageController
 *
 * Handles cage management and pet check-in/check-out operations.
 * Routes: /api/cages
 */
@ApiTags('Cage Management')
@Controller('api/cages')
export class CageController {
  constructor(private readonly cageService: CageService) {}

  // ============================================
  // CAGE CRUD
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create new cage' })
  @ApiResponse({ status: 201, description: 'Cage created', type: Cage })
  @ApiResponse({ status: 409, description: 'Cage number already exists' })
  async createCage(@Body() dto: CreateCageDto): Promise<Cage> {
    return this.cageService.createCage(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cages with optional filters' })
  @ApiQuery({ name: 'size', required: false, type: String })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of all cages', type: [Cage] })
  async getAllCages(
    @Query('size') size?: string,
    @Query('isAvailable') isAvailable?: boolean,
  ): Promise<Cage[]> {
    return this.cageService.getAllCages({ size, isAvailable });
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available cages' })
  @ApiQuery({ name: 'size', required: false, type: String })
  @ApiQuery({ name: 'dateRange', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of available cages',
    type: [Cage],
  })
  async getAvailableCages(
    @Query('size') size?: string,
    @Query('dateRange') dateRange?: string,
  ): Promise<Cage[]> {
    return this.cageService.getAvailableCages({ size, dateRange });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cage by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cage retrieved', type: Cage })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async getCageById(@Param('id', ParseIntPipe) id: number): Promise<Cage> {
    return this.cageService.getCageById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cage details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cage updated', type: Cage })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async updateCage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCageDto,
  ): Promise<Cage> {
    return this.cageService.updateCage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cage (marks as out of service)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cage deleted' })
  @ApiResponse({ status: 400, description: 'Cage has active assignments' })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async deleteCage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.cageService.deleteCage(id);
    return { message: 'Cage marked as out of service' };
  }

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  @Put(':id/maintenance')
  @ApiOperation({ summary: 'Put cage into maintenance mode' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cage in maintenance', type: Cage })
  @ApiResponse({
    status: 400,
    description: 'Cannot put occupied cage in maintenance',
  })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async startMaintenance(@Param('id', ParseIntPipe) id: number): Promise<Cage> {
    return this.cageService.startMaintenance(id);
  }

  @Put(':id/complete-maintenance')
  @ApiOperation({ summary: 'Complete maintenance and make cage available' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Maintenance completed',
    type: Cage,
  })
  @ApiResponse({ status: 400, description: 'Cage is not in maintenance' })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async completeMaintenance(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cage> {
    return this.cageService.completeMaintenance(id);
  }

  @Put(':id/reserve')
  @ApiOperation({ summary: 'Reserve cage for upcoming booking' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cage reserved', type: Cage })
  @ApiResponse({ status: 400, description: 'Cage is not available' })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async reserveCage(@Param('id', ParseIntPipe) id: number): Promise<Cage> {
    return this.cageService.reserveCage(id);
  }

  @Put(':id/cancel-reservation')
  @ApiOperation({ summary: 'Cancel cage reservation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Reservation cancelled',
    type: Cage,
  })
  @ApiResponse({ status: 400, description: 'Cage is not reserved' })
  @ApiResponse({ status: 404, description: 'Cage not found' })
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cage> {
    return this.cageService.cancelReservation(id);
  }

  // ============================================
  // CAGE ASSIGNMENTS (Check-in/Check-out)
  // ============================================

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign pet to cage (check-in)' })
  @ApiParam({ name: 'id', type: Number, description: 'Cage ID' })
  @ApiResponse({
    status: 201,
    description: 'Pet checked in',
    type: CageAssignment,
  })
  @ApiResponse({
    status: 400,
    description: 'Cage not available or pet already assigned',
  })
  @ApiResponse({ status: 404, description: 'Cage or pet not found' })
  async assignPetToCage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCageDto,
  ): Promise<CageAssignment> {
    return this.cageService.assignPetToCage(id, dto);
  }

  @Put('assignments/:assignmentId/checkout')
  @ApiOperation({ summary: 'Check out pet from cage' })
  @ApiParam({ name: 'assignmentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pet checked out',
    type: CageAssignment,
  })
  @ApiResponse({ status: 400, description: 'Assignment not active' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async checkOutPet(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<CageAssignment> {
    return this.cageService.checkOutPet(assignmentId);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get all assignments for a cage' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of assignments',
    type: [CageAssignment],
  })
  async getCageAssignments(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CageAssignment[]> {
    return this.cageService.getCageAssignments(id);
  }

  @Get(':id/current-assignment')
  @ApiOperation({ summary: 'Get current active assignment for a cage' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Active assignment',
    type: CageAssignment,
  })
  async getActiveCageAssignment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CageAssignment | null> {
    return this.cageService.getActiveCageAssignment(id);
  }

  @Get('assignments/active')
  @ApiOperation({ summary: 'Get all active cage assignments' })
  @ApiResponse({
    status: 200,
    description: 'List of active assignments',
    type: [CageAssignment],
  })
  async getAllActiveAssignments(): Promise<CageAssignment[]> {
    return this.cageService.getAllActiveAssignments();
  }
}
