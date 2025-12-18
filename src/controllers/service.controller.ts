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
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceService } from '../services/service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from '../dto/service';

/**
 * ServiceController
 *
 * Manages service catalog endpoints.
 */
@ApiTags('Service Catalog')
@Controller('api/services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * POST /api/services
   * Creates new service in catalog.
   */
  @Post()
  @ApiOperation({ summary: 'Create service' })
  @ApiResponse({
    status: 201,
    description: 'Service created',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Service already exists' })
  async createService(
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.createService(dto);
  }

  /**
   * GET /api/services
   * Retrieves all services.
   */
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({
    name: 'includeUnavailable',
    required: false,
    type: Boolean,
    description: 'Include unavailable services',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved',
    type: [ServiceResponseDto],
  })
  async getAllServices(
    @Query('includeUnavailable', new DefaultValuePipe(false), ParseBoolPipe)
    includeUnavailable: boolean,
  ): Promise<ServiceResponseDto[]> {
    return this.serviceService.getAllServices(includeUnavailable);
  }

  /**
   * GET /api/services/search
   * Searches services by name.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search services' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search term',
  })
  @ApiResponse({
    status: 200,
    description: 'Services found',
    type: [ServiceResponseDto],
  })
  async searchServices(
    @Query('q') searchTerm: string,
  ): Promise<ServiceResponseDto[]> {
    return this.serviceService.searchServices(searchTerm);
  }

  /**
   * GET /api/services/category/:categoryId
   * Gets services by category.
   */
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get services by category' })
  @ApiParam({ name: 'categoryId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved',
    type: [ServiceResponseDto],
  })
  async getServicesByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<ServiceResponseDto[]> {
    return this.serviceService.getServicesByCategory(categoryId);
  }

  /**
   * GET /api/services/price-range
   * Gets services by price range.
   */
  @Get('price-range')
  @ApiOperation({ summary: 'Get services by price range' })
  @ApiQuery({ name: 'min', required: true, type: Number })
  @ApiQuery({ name: 'max', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved',
    type: [ServiceResponseDto],
  })
  async getServicesByPriceRange(
    @Query('min', ParseIntPipe) minPrice: number,
    @Query('max', ParseIntPipe) maxPrice: number,
  ): Promise<ServiceResponseDto[]> {
    return this.serviceService.getServicesByPriceRange(minPrice, maxPrice);
  }

  /**
   * GET /api/services/boarding
   * Gets boarding services only.
   */
  @Get('boarding')
  @ApiOperation({ summary: 'Get boarding services' })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved',
    type: [ServiceResponseDto],
  })
  async getBoardingServices(): Promise<ServiceResponseDto[]> {
    return this.serviceService.getBoardingServices();
  }

  /**
   * GET /api/services/staff-type/:staffType
   * Gets services by required staff type.
   */
  @Get('staff-type/:staffType')
  @ApiOperation({ summary: 'Get services by staff type' })
  @ApiParam({
    name: 'staffType',
    type: String,
    enum: ['Veterinarian', 'CareStaff', 'Any'],
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved',
    type: [ServiceResponseDto],
  })
  async getServicesByStaffType(
    @Param('staffType') staffType: string,
  ): Promise<ServiceResponseDto[]> {
    return this.serviceService.getServicesByStaffType(staffType);
  }

  /**
   * GET /api/services/:id
   * Gets service by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getServiceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.getServiceById(id);
  }

  /**
   * PUT /api/services/:id
   * Updates service details.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Service updated',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.updateService(id, dto);
  }

  /**
   * DELETE /api/services/:id
   * Soft deletes service (marks as unavailable).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deleteService(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    const result = await this.serviceService.deleteService(id);
    return { deleted: result };
  }

  /**
   * PUT /api/services/:id/availability
   * Toggles service availability.
   */
  @Put(':id/availability')
  @ApiOperation({ summary: 'Toggle service availability' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Availability updated',
    type: ServiceResponseDto,
  })
  async updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isAvailable: boolean },
  ): Promise<ServiceResponseDto> {
    return this.serviceService.updateServiceAvailability(id, body.isAvailable);
  }

  /**
   * POST /api/services/:id/calculate-price
   * Calculates service price with pet size modifier.
   */
  @Post(':id/calculate-price')
  @ApiOperation({ summary: 'Calculate service price' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'petSize',
    required: false,
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
  })
  @ApiResponse({ status: 200, description: 'Price calculated' })
  async calculatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Query('petSize') petSize?: string,
  ): Promise<{ basePrice: number; modifier: number; finalPrice: number }> {
    return this.serviceService.calculateServicePrice(id, petSize);
  }
}
