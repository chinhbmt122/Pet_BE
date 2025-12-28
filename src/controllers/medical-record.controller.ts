import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MedicalRecordService } from '../services/medical-record.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordResponseDto,
} from '../dto/medical-record';
import { MedicalRecord } from '../entities/medical-record.entity';
import {
  CreateVaccinationDto,
  VaccinationResponseDto,
} from '../dto/vaccination';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { Account, UserType } from '../entities/account.entity';
import { GetUser } from '../middleware/decorators/user.decorator';

/**
 * MedicalRecordController
 *
 * Handles medical record and vaccination endpoints.
 * Routes: /api/medical-records, /api/pets/:petId/vaccinations
 */
@ApiTags('Medical Record')
@Controller('api')
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  // ============================================
  // MEDICAL RECORDS
  // ============================================

  /**
   * GET /api/medical-records
   * Retrieves all medical records (for Veterinarian/Manager).
   */
  @Get('medical-records')
  @RouteConfig({
    message: 'Get all medical records',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all medical records' })
  @ApiResponse({
    status: 200,
    description: 'Medical records retrieved',
    type: [MedicalRecordResponseDto],
  })
  async getAllMedicalRecords(
    @GetUser() user: Account,
  ): Promise<MedicalRecord[]> {
    return this.medicalRecordService.getAllMedicalRecords(user);
  }

  /**
   * POST /api/medical-records
   * Creates new medical record for pet with diagnosis and treatment.
   */
  @Post('medical-records')
  @RouteConfig({
    message: 'Create medical record (Veterinarian only)',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create medical record' })
  @ApiResponse({
    status: 201,
    description: 'Medical record created',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid veterinarian' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async createMedicalRecord(
    @Body() dto: CreateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.createMedicalRecord(dto);
  }

  /**
   * GET /api/medical-records/:id
   * Retrieves complete medical record by ID.
   */
  @Get('medical-records/:id')
  @RouteConfig({
    message: 'Get medical record by ID',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get medical record by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medical record retrieved',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  async getMedicalRecordById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: Account,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.getMedicalRecordById(id, user);
  }

  /**
   * GET /api/medical-records/pet/:petId
   * Retrieves complete medical history for a pet.
   */
  @Get('medical-records/pet/:petId')
  @RouteConfig({
    message: 'Get medical history by pet',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get medical history by pet' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medical history retrieved',
    type: [MedicalRecordResponseDto],
  })
  async getMedicalHistoryByPet(
    @Param('petId', ParseIntPipe) petId: number,
    @GetUser() user: Account,
  ): Promise<MedicalRecordResponseDto[]> {
    return this.medicalRecordService.getMedicalHistoryByPet(petId, user);
  }

  /**
   * PUT /api/medical-records/:id
   * Updates existing medical record.
   */
  @Put('medical-records/:id')
  @RouteConfig({
    message: 'Update medical record (Veterinarian only)',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update medical record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medical record updated',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  async updateMedicalRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.updateMedicalRecord(id, dto);
  }

  /**
   * GET /api/medical-records/pet/:petId/overdue-followups
   * Gets records with overdue follow-ups.
   */
  @Get('medical-records/pet/:petId/overdue-followups')
  @RouteConfig({
    message: 'Get overdue follow-ups',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overdue follow-ups' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Overdue follow-ups retrieved',
    type: [MedicalRecordResponseDto],
  })
  async getOverdueFollowUps(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<MedicalRecordResponseDto[]> {
    return this.medicalRecordService.getOverdueFollowUps(petId);
  }

  // ============================================
  // VACCINE TYPES (Catalog)
  // ============================================

  /**
   * GET /api/vaccine-types
   * Retrieves all active vaccine types for dropdown selection.
   */
  @Get('vaccine-types')
  @RouteConfig({
    message: 'Get all vaccine types',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vaccine types for dropdown' })
  @ApiResponse({
    status: 200,
    description: 'Vaccine types retrieved',
  })
  async getAllVaccineTypes() {
    return this.medicalRecordService.getAllVaccineTypes();
  }

  // ============================================
  // VACCINATIONS
  // ============================================

  /**
   * POST /api/pets/:petId/vaccinations
   * Records vaccination with auto-calculated next due date.
   */
  @Post('pets/:petId/vaccinations')
  @RouteConfig({
    message: 'Add vaccination (Veterinarian only)',
    requiresAuth: true,
    roles: [UserType.VETERINARIAN, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add vaccination' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Vaccination recorded',
    type: VaccinationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid veterinarian' })
  @ApiResponse({ status: 404, description: 'Pet or vaccine type not found' })
  async addVaccination(
    @Param('petId', ParseIntPipe) petId: number,
    @Body() dto: CreateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    return this.medicalRecordService.addVaccination(petId, dto);
  }

  /**
   * GET /api/pets/:petId/vaccinations
   * Retrieves all vaccinations for a pet.
   */
  @Get('pets/:petId/vaccinations')
  @RouteConfig({
    message: 'Get vaccination history',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vaccination history' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Vaccinations retrieved',
    type: [VaccinationResponseDto],
  })
  async getVaccinationHistory(
    @Param('petId', ParseIntPipe) petId: number,
    @GetUser() user: Account,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getVaccinationHistory(petId, user);
  }

  /**
   * GET /api/pets/:petId/vaccinations/upcoming
   * Gets vaccinations due within specified days.
   */
  @Get('pets/:petId/vaccinations/upcoming')
  @RouteConfig({
    message: 'Get upcoming vaccinations',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming vaccinations' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days ahead to check (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming vaccinations retrieved',
    type: [VaccinationResponseDto],
  })
  async getUpcomingVaccinations(
    @Param('petId', ParseIntPipe) petId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) daysAhead: number,
    @GetUser() user: Account,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getUpcomingVaccinations(
      petId,
      daysAhead,
      user,
    );
  }

  /**
   * GET /api/pets/:petId/vaccinations/overdue
   * Gets overdue vaccinations for a pet.
   */
  @Get('pets/:petId/vaccinations/overdue')
  @RouteConfig({
    message: 'Get overdue vaccinations',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.VETERINARIAN, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overdue vaccinations' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Overdue vaccinations retrieved',
    type: [VaccinationResponseDto],
  })
  async getOverdueVaccinations(
    @Param('petId', ParseIntPipe) petId: number,
    @GetUser() user: Account,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getOverdueVaccinations(petId, user);
  }
}
