import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
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
}
