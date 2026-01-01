import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
   * Helper to get default date range (last 30 days)
   */
  private getDefaultDateRange(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(end.getTime())) {
      return {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
    }
    if (isNaN(start.getTime())) {
      return { start: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000), end };
    }

    return { start, end };
  }

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
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    return this.reportService.generateFinancialReport(start, end);
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
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
    @Query('year') year: string,
  ) {
    // Convert year to number, default to current year
    const yearNum = year ? Number(year) : new Date().getFullYear();
    const validYear = isNaN(yearNum) ? new Date().getFullYear() : yearNum;
    return this.reportService.getRevenueByPeriod(period, validYear);
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
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    return this.reportService.getAppointmentStatistics(start, end);
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
    @Query('limit') limit: string = '10',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sortBy') sortBy: 'count' | 'revenue' = 'revenue',
  ) {
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    const limitNum = Number(limit) || 10;
    return this.reportService.getTopServices(limitNum, start, end, sortBy);
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
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    return this.reportService.getServicePerformanceReport(start, end);
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
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    return this.reportService.getEmployeeWorkloadReport(start, end);
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
    const { start, end } = this.getDefaultDateRange(startDate, endDate);
    return this.reportService.getCustomerRetentionReport(start, end);
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
