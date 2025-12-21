import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';

/**
 * ReportController
 *
 * Manages report generation endpoints.
 * Routes: GET /api/reports/financial, GET /api/reports/appointments, GET /api/dashboard
 * All endpoints restricted to MANAGER role only.
 */
@ApiTags('Report')
@Controller('api/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * GET /api/reports/financial
   * Generates comprehensive financial report with revenue, expenses, and profit.
   */
  @Get('financial')
  @RouteConfig({
    message: 'Generate financial report (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate financial report' })
  @ApiResponse({ status: 200, description: 'Financial report generated' })
  async generateFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.generateFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/reports/revenue
   * Gets revenue breakdown by month, quarter, or year.
   */
  @Get('revenue')
  @RouteConfig({
    message: 'Get revenue by period (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue by period' })
  @ApiResponse({ status: 200, description: 'Revenue data retrieved' })
  async getRevenueByPeriod(
    @Query('period') period: 'month' | 'quarter' | 'year',
    @Query('year') year: number,
  ) {
    return this.reportService.getRevenueByPeriod(period, year);
  }

  /**
   * GET /api/reports/appointments
   * Generates appointment statistics and trends.
   */
  @Get('appointments')
  @RouteConfig({
    message: 'Get appointment statistics (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiResponse({ status: 200, description: 'Appointment statistics retrieved' })
  async getAppointmentStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getAppointmentStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/reports/services/top
   * Returns top N services by booking count or revenue.
   */
  @Get('services/top')
  @RouteConfig({
    message: 'Get top services (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top services' })
  @ApiResponse({ status: 200, description: 'Top services retrieved' })
  async getTopServices(
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sortBy') sortBy: 'count' | 'revenue' = 'revenue',
  ) {
    return this.reportService.getTopServices(
      limit,
      new Date(startDate),
      new Date(endDate),
      sortBy,
    );
  }

  /**
   * GET /api/reports/services/performance
   * Gets service performance analysis.
   */
  @Get('services/performance')
  @RouteConfig({
    message: 'Get service performance (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get service performance report' })
  @ApiResponse({ status: 200, description: 'Service performance retrieved' })
  async getServicePerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getServicePerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/reports/employees/workload
   * Calculates employee workload statistics for period.
   */
  @Get('employees/workload')
  @RouteConfig({
    message: 'Get employee workload (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get employee workload report' })
  @ApiResponse({ status: 200, description: 'Workload report generated' })
  async getEmployeeWorkloadReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getEmployeeWorkloadReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/reports/customers/retention
   * Gets customer retention and behavior metrics.
   */
  @Get('customers/retention')
  @RouteConfig({
    message: 'Get customer retention (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer retention report' })
  @ApiResponse({
    status: 200,
    description: 'Customer retention data retrieved',
  })
  async getCustomerRetention(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getCustomerRetentionReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/reports/dashboard
   * Gets dashboard overview with key metrics.
   */
  @Get('dashboard')
  @RouteConfig({
    message: 'Get dashboard data (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard() {
    return this.reportService.getDashboard();
  }
}
