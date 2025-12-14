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
    Req,
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
    constructor(private readonly employeeService: EmployeeService) { }

    /**
     * POST /api/employees
     * Create new employee (Manager only)
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RouteConfig({ message: 'Create employee (Manager only)', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new employee (Manager only)' })
    @ApiResponse({ status: 201, type: EmployeeResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
    async create(
        @Req() request: any,
        @Body() dto: CreateEmployeeDto,
    ): Promise<Employee> {
        const callerAccountId = request.user.accountId;
        return this.employeeService.create(callerAccountId, dto);
    }

    /**
     * GET /api/employees
     * Get all employees
     */
    @Get()
    @RouteConfig({ message: 'Get all employees', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all employees' })
    @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
    async getAll(): Promise<Employee[]> {
        return this.employeeService.getAll();
    }

    /**
     * GET /api/employees/available
     * Get available employees
     */
    @Get('available')
    @RouteConfig({ message: 'Get available employees', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get available employees' })
    @ApiQuery({ name: 'role', required: false, enum: UserType })
    @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
    async getAvailable(
        @Query('role') role?: UserType,
    ): Promise<Employee[]> {
        if (role) {
            return this.employeeService.getAvailableByRole(role);
        }
        return this.employeeService.getAvailable();
    }

    /**
     * GET /api/employees/by-role/:role
     * Get employees by role
     */
    @Get('by-role/:role')
    @RouteConfig({ message: 'Get employees by role', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get employees by role type' })
    @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
    async getByRole(
        @Param('role') role: UserType,
    ): Promise<Employee[]> {
        return this.employeeService.getByRole(role);
    }

    /**
     * GET /api/employees/:id
     * Get employee by ID
     */
    @Get(':id')
    @RouteConfig({ message: 'Get employee by ID', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get employee by ID' })
    @ApiResponse({ status: 200, type: EmployeeResponseDto })
    @ApiResponse({ status: 404, description: 'Not found' })
    async getById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Employee> {
        return this.employeeService.getById(id);
    }

    /**
     * PUT /api/employees/:id
     * Update employee
     */
    @Put(':id')
    @RouteConfig({ message: 'Update employee', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update employee (self or Manager)' })
    @ApiResponse({ status: 200, type: EmployeeResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async update(
        @Req() request: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeDto,
    ): Promise<Employee> {
        const callerAccountId = request.user.accountId;
        return this.employeeService.update(callerAccountId, id, dto);
    }

    /**
     * PUT /api/employees/:id/available
     * Mark employee as available
     */
    @Put(':id/available')
    @RouteConfig({ message: 'Mark employee available', requiresAuth: true })
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
    @RouteConfig({ message: 'Mark employee unavailable', requiresAuth: true })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark employee as unavailable' })
    @ApiResponse({ status: 200, type: EmployeeResponseDto })
    async markUnavailable(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Employee> {
        return this.employeeService.markUnavailable(id);
    }
}
