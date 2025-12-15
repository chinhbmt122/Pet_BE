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
} from '@nestjs/swagger';
import { MedicalRecordService } from '../services/medical-record.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordResponseDto,
} from '../dto/medical-record';
import { CreateVaccinationDto, VaccinationResponseDto } from '../dto/vaccination';

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
   * POST /api/medical-records
   * Creates new medical record for pet with diagnosis and treatment.
   */
  @Post('medical-records')
  @ApiOperation({ summary: 'Create medical record' })
  @ApiResponse({ status: 201, description: 'Medical record created', type: MedicalRecordResponseDto })
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
  @ApiOperation({ summary: 'Get medical record by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Medical record retrieved', type: MedicalRecordResponseDto })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  async getMedicalRecordById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.getMedicalRecordById(id);
  }

  /**
   * GET /api/medical-records/pet/:petId
   * Retrieves complete medical history for a pet.
   */
  @Get('medical-records/pet/:petId')
  @ApiOperation({ summary: 'Get medical history by pet' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({ status: 200, description: 'Medical history retrieved', type: [MedicalRecordResponseDto] })
  async getMedicalHistoryByPet(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<MedicalRecordResponseDto[]> {
    return this.medicalRecordService.getMedicalHistoryByPet(petId);
  }

  /**
   * PUT /api/medical-records/:id
   * Updates existing medical record.
   */
  @Put('medical-records/:id')
  @ApiOperation({ summary: 'Update medical record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Medical record updated', type: MedicalRecordResponseDto })
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
  @ApiOperation({ summary: 'Get overdue follow-ups' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({ status: 200, description: 'Overdue follow-ups retrieved', type: [MedicalRecordResponseDto] })
  async getOverdueFollowUps(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<MedicalRecordResponseDto[]> {
    return this.medicalRecordService.getOverdueFollowUps(petId);
  }

  // ============================================
  // VACCINATIONS
  // ============================================

  /**
   * POST /api/pets/:petId/vaccinations
   * Records vaccination with auto-calculated next due date.
   */
  @Post('pets/:petId/vaccinations')
  @ApiOperation({ summary: 'Add vaccination' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({ status: 201, description: 'Vaccination recorded', type: VaccinationResponseDto })
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
  @ApiOperation({ summary: 'Get vaccination history' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({ status: 200, description: 'Vaccinations retrieved', type: [VaccinationResponseDto] })
  async getVaccinationHistory(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getVaccinationHistory(petId);
  }

  /**
   * GET /api/pets/:petId/vaccinations/upcoming
   * Gets vaccinations due within specified days.
   */
  @Get('pets/:petId/vaccinations/upcoming')
  @ApiOperation({ summary: 'Get upcoming vaccinations' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days ahead to check (default: 30)' })
  @ApiResponse({ status: 200, description: 'Upcoming vaccinations retrieved', type: [VaccinationResponseDto] })
  async getUpcomingVaccinations(
    @Param('petId', ParseIntPipe) petId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) daysAhead: number,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getUpcomingVaccinations(petId, daysAhead);
  }

  /**
   * GET /api/pets/:petId/vaccinations/overdue
   * Gets overdue vaccinations for a pet.
   */
  @Get('pets/:petId/vaccinations/overdue')
  @ApiOperation({ summary: 'Get overdue vaccinations' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiResponse({ status: 200, description: 'Overdue vaccinations retrieved', type: [VaccinationResponseDto] })
  async getOverdueVaccinations(
    @Param('petId', ParseIntPipe) petId: number,
  ): Promise<VaccinationResponseDto[]> {
    return this.medicalRecordService.getOverdueVaccinations(petId);
  }
}
