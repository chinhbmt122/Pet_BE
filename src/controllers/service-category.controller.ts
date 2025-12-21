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
import { ServiceCategoryService } from '../services/service-category.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  ServiceCategoryResponseDto,
} from '../dto/service-category';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

/**
 * ServiceCategoryController
 *
 * Manages service category endpoints.
 */
@ApiTags('Service Category')
@Controller('api/service-categories')
export class ServiceCategoryController {
  constructor(private readonly categoryService: ServiceCategoryService) {}

  /**
   * POST /api/service-categories
   * Creates new category.
   */
  @Post()
  @RouteConfig({
    message: 'Create service category (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service category' })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    type: ServiceCategoryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async createCategory(
    @Body() dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.createCategory(dto);
  }

  /**
   * GET /api/service-categories
   * Gets all categories. Public access for service browsing.
   */
  @Get()
  @RouteConfig({
    message: 'Get all service categories',
    requiresAuth: false, // Public for browsing
  })
  @ApiOperation({ summary: 'Get all service categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved',
    type: [ServiceCategoryResponseDto],
  })
  async getAllCategories(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ): Promise<ServiceCategoryResponseDto[]> {
    return this.categoryService.getAllCategories(includeInactive);
  }

  /**
   * GET /api/service-categories/:id
   * Gets category by ID. Public access.
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get category by ID',
    requiresAuth: false, // Public
  })
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved',
    type: ServiceCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.getCategoryById(id);
  }

  /**
   * PUT /api/service-categories/:id
   * Updates category. Manager only.
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update category (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Category updated',
    type: ServiceCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.updateCategory(id, dto);
  }

  /**
   * PUT /api/service-categories/:id/toggle-active
   * Toggles category active status. Manager only.
   */
  @Put(':id/toggle-active')
  @RouteConfig({
    message: 'Toggle category active (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle category active status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Status toggled',
    type: ServiceCategoryResponseDto,
  })
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.toggleActive(id);
  }

  /**
   * DELETE /api/service-categories/:id
   * Deletes category. Manager only.
   */
  @Delete(':id')
  @RouteConfig({
    message: 'Delete category (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category has linked services' })
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    const result = await this.categoryService.deleteCategory(id);
    return { deleted: result };
  }
}
