import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PetOwnerService } from '../services/pet-owner.service';
import { PetOwner } from '../entities/pet-owner.entity';
import {
  RegisterPetOwnerDto,
  UpdatePetOwnerDto,
  PetOwnerResponseDto,
} from '../dto/pet-owner';
import { RouteConfig } from '../middleware/decorators/route.decorator';

/**
 * PetOwnerController
 *
 * Handles PetOwner endpoints:
 * - Registration (public)
 * - Get profile
 * - Update profile
 */
@ApiTags('Pet Owners')
@Controller('api/pet-owners')
export class PetOwnerController {
  constructor(private readonly petOwnerService: PetOwnerService) {}

  /**
   * GET /api/pet-owners
   * Get all pet owners with optional search filters
   */
  @Get()
  @RouteConfig({ message: 'Get all pet owners', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pet owners' })
  @ApiQuery({ name: 'fullName', required: false, type: String })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiResponse({ status: 200, type: [PetOwnerResponseDto] })
  async getAllPetOwners(
    @Query('fullName') fullName?: string,
    @Query('phoneNumber') phoneNumber?: string,
  ): Promise<PetOwner[]> {
    return this.petOwnerService.getAllPetOwners({ fullName, phoneNumber });
  }

  /**
   * GET /api/pet-owners/search
   * Search pet owners by criteria
   */
  @Get('search')
  @RouteConfig({ message: 'Search pet owners', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search pet owners' })
  @ApiQuery({ name: 'fullName', required: false, type: String })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiResponse({ status: 200, type: [PetOwnerResponseDto] })
  async searchPetOwners(
    @Query('fullName') fullName?: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('email') email?: string,
  ): Promise<PetOwner[]> {
    return this.petOwnerService.getAllPetOwners({
      fullName,
      phoneNumber,
      email,
    });
  }

  /**
   * POST /api/pet-owners/register
   * Public endpoint for PetOwner self-registration
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RouteConfig({ message: 'PetOwner registration', requiresAuth: false })
  @ApiOperation({ summary: 'Register a new pet owner (public)' })
  @ApiResponse({ status: 201, type: PetOwnerResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterPetOwnerDto): Promise<PetOwner> {
    return this.petOwnerService.register(dto);
  }

  /**
   * GET /api/pet-owners/:accountId
   * Get PetOwner by account ID
   */
  @Get(':accountId')
  @RouteConfig({ message: 'Get pet owner profile', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pet owner by account ID' })
  @ApiResponse({ status: 200, type: PetOwnerResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getByAccountId(
    @Param('accountId', ParseIntPipe) accountId: number,
  ): Promise<PetOwner> {
    return this.petOwnerService.getByAccountId(accountId);
  }

  /**
   * PUT /api/pet-owners/:accountId/profile
   * Update PetOwner profile
   */
  @Put(':accountId/profile')
  @RouteConfig({ message: 'Update pet owner profile', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pet owner profile' })
  @ApiResponse({ status: 200, type: PetOwnerResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateProfile(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdatePetOwnerDto,
  ): Promise<PetOwner> {
    return this.petOwnerService.updateProfile(accountId, dto);
  }

  /**
   * PUT /api/pet-owners/:accountId/preferences
   * Update PetOwner contact preferences
   */
  @Put(':accountId/preferences')
  @RouteConfig({ message: 'Update pet owner preferences', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pet owner contact preferences' })
  @ApiResponse({ status: 200, type: PetOwnerResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updatePreferences(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdatePetOwnerDto,
  ): Promise<PetOwner> {
    return this.petOwnerService.updatePreferences(accountId, {
      preferredContactMethod: dto.preferredContactMethod,
      emergencyContact: dto.emergencyContact,
    });
  }

  /**
   * GET /api/pet-owners/:id/appointments
   * Get all appointments for a pet owner
   */
  @Get(':id/appointments')
  @RouteConfig({ message: 'Get pet owner appointments', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments for a pet owner' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Pet owner not found' })
  async getPetOwnerAppointments(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
  ): Promise<any[]> {
    return this.petOwnerService.getAppointments(id, status);
  }

  /**
   * GET /api/pet-owners/:id/invoices
   * Get all invoices for a pet owner
   */
  @Get(':id/invoices')
  @RouteConfig({ message: 'Get pet owner invoices', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoices for a pet owner' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Pet owner not found' })
  async getPetOwnerInvoices(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
  ): Promise<any[]> {
    return this.petOwnerService.getInvoices(id, status);
  }
}
