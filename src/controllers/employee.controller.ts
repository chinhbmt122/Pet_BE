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
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../entities/employee.entity';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeResponseDto,
} from '../dto/employee';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/types/entity.types';
import { Account } from '../entities/account.entity';
import { GetUser } from '../middleware/decorators/user.decorator';

/**
 * EmployeeController
 *
 * Handles Employee endpoints:
 * - Create (Manager only)
 * - Get all / by ID / by role
 * - Update
 * - Availability management
 */
@ApiTags('Employees')
@Controller('api/employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  /**
   * POST /api/employees
   * Create new employee (Manager only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RouteConfig({
    message: 'Create employee (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new employee (Manager only)' })
  @ApiResponse({ status: 201, type: EmployeeResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  async create(
    @GetUser() user: Account,
    @Body() dto: CreateEmployeeDto,
  ): Promise<Employee> {
    const callerAccountId = user.accountId;
    return this.employeeService.create(callerAccountId, dto);
  }

  /**
   * GET /api/employees
   * Get all employees with optional filters
   */
  @Get()
  @RouteConfig({
    message: 'Get all employees',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all employees with optional filters' })
  @ApiQuery({ name: 'role', required: false, enum: UserType })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiQuery({ name: 'fullName', required: false, type: String })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  async getAll(
    @Query('role') role?: UserType,
    @Query('available') available?: boolean,
    @Query('fullName') fullName?: string,
  ): Promise<Employee[]> {
    return this.employeeService.getAll({ role, available, fullName });
  }

  /**
   * GET /api/employees/veterinarians
   * Get all veterinarians
   */
  @Get('veterinarians')
  @RouteConfig({ message: 'Get veterinarians', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all veterinarians' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  async getVeterinarians(): Promise<Employee[]> {
    return this.employeeService.getByRole(UserType.VETERINARIAN);
  }

  /**
   * GET /api/employees/care-staff
   * Get all care staff
   */
  @Get('care-staff')
  @RouteConfig({ message: 'Get care staff', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all care staff' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  async getCareStaff(): Promise<Employee[]> {
    return this.employeeService.getByRole(UserType.CARE_STAFF);
  }

  /**
   * GET /api/employees/available
   * Get available employees
   */
  @Get('available')
  @RouteConfig({
    message: 'Get available employees',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available employees' })
  @ApiQuery({ name: 'role', required: false, enum: UserType })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  async getAvailable(@Query('role') role?: UserType): Promise<Employee[]> {
    return this.employeeService.getAll({ role, available: true });
  }

  /**
   * GET /api/employees/by-role/:role
   * Get employees by role
   */
  @Get('by-role/:role')
  @RouteConfig({
    message: 'Get employees by role',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get employees by role type' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  async getByRole(@Param('role') role: UserType): Promise<Employee[]> {
    return this.employeeService.getByRole(role);
  }

  /**
   * GET /api/employees/:id
   * Get employee by ID
   */
  @Get(':id')
  @RouteConfig({
    message: 'Get employee by ID',
    requiresAuth: true,
    roles: [
      UserType.MANAGER,
      UserType.RECEPTIONIST,
      UserType.VETERINARIAN,
      UserType.CARE_STAFF,
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Employee> {
    return this.employeeService.getById(id);
  }

  /**
   * PUT /api/employees/:id
   * Update employee
   */
  @Put(':id')
  @RouteConfig({
    message: 'Update employee',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update employee (self or Manager)' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @GetUser() user: Account,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const callerAccountId = user.accountId;
    return this.employeeService.update(callerAccountId, id, dto);
  }

  /**
   * PUT /api/employees/:id/available
   * Mark employee as available
   */
  @Put(':id/available')
  @RouteConfig({
    message: 'Mark employee available',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark employee as available' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async markAvailable(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Employee> {
    return this.employeeService.markAvailable(id);
  }

  /**
   * PUT /api/employees/:id/unavailable
   * Mark employee as unavailable
   */
  @Put(':id/unavailable')
  @RouteConfig({
    message: 'Mark employee unavailable',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark employee as unavailable' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  async markUnavailable(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Employee> {
    return this.employeeService.markUnavailable(id);
  }
}
