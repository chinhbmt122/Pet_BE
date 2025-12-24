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
import { PetService } from '../services/pet.service';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from '../dto/pet';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

/**
 * PetController
 *
 * Handles pet profile CRUD operations.
 * Routes: GET /api/pets, POST /api/pets, PUT /api/pets/:id
 */
@ApiTags('Pet')
@Controller('api/pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  /**
   * POST /api/pets
   * Registers new pet with owner association.
   */
  @Post()
  @RouteConfig({
    message: 'Register pet',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register pet' })
  @ApiQuery({ name: 'ownerId', required: true, type: Number })
  @ApiResponse({
    status: 201,
    description: 'Pet registered',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  async registerPet(
    @Body() dto: CreatePetDto,
    @Query('ownerId', ParseIntPipe) ownerId: number,
    @Req() req: any,
  ): Promise<PetResponseDto> {
    const user = req.user;
    return this.petService.registerPet(dto, ownerId, user);
  }

  /**
   * GET /api/pets/:id
   * Retrieves complete pet profile by ID.
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get pet by ID',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.MANAGER, UserType.RECEPTIONIST, UserType.VETERINARIAN],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pet retrieved',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async getPetById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<PetResponseDto> {
    const user = req.user;
    return this.petService.getPetById(id, user);
  }

  /**
   * GET /api/pets/owner/:ownerId
   * Retrieves all pets belonging to a specific owner.
   */
  @Get('owner/:ownerId')
  @RouteConfig({
    message: 'Get pets by owner',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.MANAGER, UserType.RECEPTIONIST, UserType.VETERINARIAN],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pets by owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pets retrieved',
    type: [PetResponseDto],
  })
  async getPetsByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Req() req: any,
  ): Promise<PetResponseDto[]> {
    const user = req.user;
    return this.petService.getPetsByOwner(ownerId, user);
  }

  /**
   * PUT /api/pets/:id
   * Updates pet information.
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update pet information',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pet information' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pet updated',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async updatePetInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePetDto,
    @Req() req: any,
  ): Promise<PetResponseDto> {
    const user = req.user;
    return this.petService.updatePetInfo(id, dto, user);
  }

  /**
   * DELETE /api/pets/:id
   * Soft deletes pet record.
   */
  @Delete(':id')
  @RouteConfig({
    message: 'Delete pet (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete pet (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pet deleted' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async deletePet(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    const result = await this.petService.deletePet(id);
    return { deleted: result };
  }

  /**
   * POST /api/pets/:id/restore
   * Restores a soft-deleted pet.
   */
  @Post(':id/restore')
  @RouteConfig({
    message: 'Restore deleted pet (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted pet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pet restored',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async restorePet(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PetResponseDto> {
    return this.petService.restore(id);
  }

  /**
   * GET /api/pets/owner/:ownerId/deleted
   * Gets soft-deleted pets for an owner.
   */
  @Get('owner/:ownerId/deleted')
  @RouteConfig({
    message: 'Get deleted pets by owner',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get deleted pets by owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Deleted pets retrieved',
    type: [PetResponseDto],
  })
  async getDeletedPetsByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ): Promise<PetResponseDto[]> {
    return this.petService.getDeletedPetsByOwner(ownerId);
  }

  /**
   * GET /api/pets/species/:species
   * Gets pets by species.
   */
  @Get('species/:species')
  @RouteConfig({
    message: 'Get pets by species',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.VETERINARIAN],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pets by species' })
  @ApiParam({ name: 'species', type: String })
  @ApiResponse({
    status: 200,
    description: 'Pets retrieved',
    type: [PetResponseDto],
  })
  async getPetsBySpecies(
    @Param('species') species: string,
  ): Promise<PetResponseDto[]> {
    return this.petService.getPetsBySpecies(species);
  }

  /**
   * PUT /api/pets/:id/transfer
   * Transfers pet ownership to another owner.
   */
  @Put(':id/transfer')
  @RouteConfig({
    message: 'Transfer pet ownership (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer pet ownership' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'newOwnerId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Ownership transferred',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pet or new owner not found' })
  async transferOwnership(
    @Param('id', ParseIntPipe) id: number,
    @Query('newOwnerId', ParseIntPipe) newOwnerId: number,
  ): Promise<PetResponseDto> {
    return this.petService.transferPetOwnership(id, newOwnerId);
  }
}
