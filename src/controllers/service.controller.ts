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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServiceService } from '../services/service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from '../dto/service';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

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
  @RouteConfig({
    message: 'Create service (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
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
   * Retrieves all services. Public access for service browsing.
   */
  @Get()
  @RouteConfig({
    message: 'Get all services',
    requiresAuth: false, // Public - pet owners can browse services
  })
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
    console.log('includeUnavailable:', includeUnavailable);
    return this.serviceService.getAllServices(includeUnavailable);
  }

  /**
   * GET /api/services/search
   * Searches services by name. Public access.
   */
  @Get('search')
  @RouteConfig({
    message: 'Search services',
    requiresAuth: false, // Public - pet owners can search services
  })
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
   * Gets services by category. Public access.
   */
  @Get('category/:categoryId')
  @RouteConfig({
    message: 'Get services by category',
    requiresAuth: false, // Public - browsing by category
  })
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
   * Gets services by price range. Public access.
   */
  @Get('price-range')
  @RouteConfig({
    message: 'Get services by price range',
    requiresAuth: false, // Public
  })
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
   * Gets boarding services only. Public access.
   */
  @Get('boarding')
  @RouteConfig({
    message: 'Get boarding services',
    requiresAuth: false, // Public
  })
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
   * Gets services by required staff type. Staff use.
   */
  @Get('staff-type/:staffType')
  @RouteConfig({
    message: 'Get services by staff type',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
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
   * Gets service by ID. Public access.
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get service by ID',
    requiresAuth: false, // Public
  })
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
   * Updates service details. Manager only.
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update service (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
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
   * Soft deletes service. Manager only.
   */
  @Delete(':id')
  @RouteConfig({
    message: 'Delete service (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
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
   * Toggles service availability. Manager only.
   */
  @Put(':id/availability')
  @RouteConfig({
    message: 'Toggle service availability (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
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
   * Calculates service price. Public for booking.
   */
  @Post(':id/calculate-price')
  @RouteConfig({
    message: 'Calculate service price',
    requiresAuth: false, // Public for price estimation during booking
  })
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
