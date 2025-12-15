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
import { PetService } from '../services/pet.service';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from '../dto/pet';

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
  @ApiOperation({ summary: 'Register pet' })
  @ApiQuery({ name: 'ownerId', required: true, type: Number })
  @ApiResponse({ status: 201, description: 'Pet registered', type: PetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  async registerPet(
    @Body() dto: CreatePetDto,
    @Query('ownerId', ParseIntPipe) ownerId: number,
  ): Promise<PetResponseDto> {
    return this.petService.registerPet(dto, ownerId);
  }

  /**
   * GET /api/pets/:id
   * Retrieves complete pet profile by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pet retrieved', type: PetResponseDto })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async getPetById(@Param('id', ParseIntPipe) id: number): Promise<PetResponseDto> {
    return this.petService.getPetById(id);
  }

  /**
   * GET /api/pets/owner/:ownerId
   * Retrieves all pets belonging to a specific owner.
   */
  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get pets by owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Pets retrieved', type: [PetResponseDto] })
  async getPetsByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ): Promise<PetResponseDto[]> {
    return this.petService.getPetsByOwner(ownerId);
  }

  /**
   * PUT /api/pets/:id
   * Updates pet information.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update pet information' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pet updated', type: PetResponseDto })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async updatePetInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePetDto,
  ): Promise<PetResponseDto> {
    return this.petService.updatePetInfo(id, dto);
  }

  /**
   * DELETE /api/pets/:id
   * Soft deletes pet record.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete pet (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pet deleted' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async deletePet(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }> {
    const result = await this.petService.deletePet(id);
    return { deleted: result };
  }

  /**
   * POST /api/pets/:id/restore
   * Restores a soft-deleted pet.
   */
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted pet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pet restored', type: PetResponseDto })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async restorePet(@Param('id', ParseIntPipe) id: number): Promise<PetResponseDto> {
    return this.petService.restore(id);
  }

  /**
   * GET /api/pets/owner/:ownerId/deleted
   * Gets soft-deleted pets for an owner.
   */
  @Get('owner/:ownerId/deleted')
  @ApiOperation({ summary: 'Get deleted pets by owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted pets retrieved', type: [PetResponseDto] })
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
  @ApiOperation({ summary: 'Get pets by species' })
  @ApiParam({ name: 'species', type: String })
  @ApiResponse({ status: 200, description: 'Pets retrieved', type: [PetResponseDto] })
  async getPetsBySpecies(@Param('species') species: string): Promise<PetResponseDto[]> {
    return this.petService.getPetsBySpecies(species);
  }

  /**
   * PUT /api/pets/:id/transfer
   * Transfers pet ownership to another owner.
   */
  @Put(':id/transfer')
  @ApiOperation({ summary: 'Transfer pet ownership' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'newOwnerId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Ownership transferred', type: PetResponseDto })
  @ApiResponse({ status: 404, description: 'Pet or new owner not found' })
  async transferOwnership(
    @Param('id', ParseIntPipe) id: number,
    @Query('newOwnerId', ParseIntPipe) newOwnerId: number,
  ): Promise<PetResponseDto> {
    return this.petService.transferPetOwnership(id, newOwnerId);
  }
}
