// PLEASE REMOVE THIS
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Service } from '../entities/service.entity';
import { Pet } from '../entities/pet.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';

/**
 * ReportService (ReportManager)
 *
 * Generates statistical reports for management decision-making.
 * Calculates number of services per month categorized by service type.
 * Computes total monthly revenue.
 * Aggregates data from appointments and invoices repositories.
 */
@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(CageAssignment)
    private readonly cageAssignmentRepository: Repository<CageAssignment>,
  ) { }

  /**
   * Generates comprehensive financial report with revenue, expenses, and profit.
   */
  async generateFinancialReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    revenue: {
      total: number;
      byStatus: Record<InvoiceStatus, number>;
      byMonth: Array<{ month: string; amount: number }>;
    };
    appointments: {
      total: number;
      completed: number;
      cancelled: number;
      averageValue: number;
    };
    summary: {
      totalRevenue: number;
      paidInvoices: number;
      pendingInvoices: number;
      completionRate: number;
    };
  }> {
    // Get all invoices in period
    const invoices = await this.invoiceRepository.find({
      where: {
        issueDate: Between(startDate, endDate),
      },
    });

    // Revenue by status
    const revenueByStatus = {
      [InvoiceStatus.PENDING]: 0,
      [InvoiceStatus.PROCESSING_ONLINE]: 0,
      [InvoiceStatus.PAID]: 0,
      [InvoiceStatus.FAILED]: 0,
    };

    invoices.forEach((inv) => {
      revenueByStatus[inv.status] += Number(inv.totalAmount);
    });

    // Revenue by month
    const monthlyRevenue = new Map<string, number>();
    invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .forEach((inv) => {
        const monthKey = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue.set(
          monthKey,
          (monthlyRevenue.get(monthKey) || 0) + Number(inv.totalAmount),
        );
      });

    const revenueByMonth = Array.from(monthlyRevenue.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Appointment statistics
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
    });

    const completedAppointments = appointments.filter(
      (apt) => apt.status === AppointmentStatus.COMPLETED,
    );
    const cancelledAppointments = appointments.filter(
      (apt) => apt.status === AppointmentStatus.CANCELLED,
    );

    const totalRevenue = completedAppointments.reduce(
      (sum, apt) => sum + Number(apt.actualCost || apt.estimatedCost || 0),
      0,
    );
    const averageValue =
      completedAppointments.length > 0
        ? totalRevenue / completedAppointments.length
        : 0;

    const paidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID,
    ).length;
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.PENDING,
    ).length;
    const completionRate =
      appointments.length > 0
        ? completedAppointments.length / appointments.length
        : 0;

    return {
      period: { startDate, endDate },
      revenue: {
        total: revenueByStatus[InvoiceStatus.PAID],
        byStatus: revenueByStatus,
        byMonth: revenueByMonth,
      },
      appointments: {
        total: appointments.length,
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        averageValue,
      },
      summary: {
        totalRevenue: revenueByStatus[InvoiceStatus.PAID],
        paidInvoices,
        pendingInvoices,
        completionRate,
      },
    };
  }

  /**
   * Gets revenue breakdown by month, quarter, or year.
   */
  async getRevenueByPeriod(
    period: 'month' | 'quarter' | 'year',
    year: number,
  ): Promise<
    Array<{
      period: string;
      revenue: number;
      invoiceCount: number;
      appointmentCount: number;
    }>
  > {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const invoices = await this.invoiceRepository.find({
        where: {
          issueDate: Between(startDate, endDate),
          status: InvoiceStatus.PAID,
        },
        relations: ['appointment'],
      });

      const periodMap = new Map<
        string,
        { revenue: number; invoiceCount: number; appointmentCount: number }
      >();

      invoices.forEach((inv) => {
        try {
          let periodKey: string;
          const date = inv.issueDate ? new Date(inv.issueDate) : new Date();

          if (period === 'month') {
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          } else if (period === 'quarter') {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
          } else {
            periodKey = `${date.getFullYear()}`;
          }

          if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, {
              revenue: 0,
              invoiceCount: 0,
              appointmentCount: 0,
            });
          }

          const stats = periodMap.get(periodKey)!;
          stats.revenue += Number(inv.totalAmount) || 0;
          stats.invoiceCount++;
          stats.appointmentCount++;
        } catch (e) {
          // Skip invalid invoice
        }
      });

      return Array.from(periodMap.entries())
        .map(([period, stats]) => ({
          period,
          ...stats,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error in getRevenueByPeriod:', error);
      return [];
    }
  }

  /**
   * Gets appointment statistics and trends.
   */
  async getAppointmentStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    byStatus: Record<AppointmentStatus, number>;
    completionRate: number;
    cancellationRate: number;
    averageValue: number;
    dailyTrend: Array<{ date: string; count: number; completed: number }>;
  }> {
    try {
      const appointments = await this.appointmentRepository.find({
        where: {
          appointmentDate: Between(startDate, endDate),
        },
      });

      const byStatus = {
        [AppointmentStatus.PENDING]: 0,
        [AppointmentStatus.CONFIRMED]: 0,
        [AppointmentStatus.IN_PROGRESS]: 0,
        [AppointmentStatus.COMPLETED]: 0,
        [AppointmentStatus.CANCELLED]: 0,
      };

      let totalValue = 0;
      const dailyMap = new Map<string, { count: number; completed: number }>();

      appointments.forEach((apt) => {
        try {
          if (apt.status && byStatus[apt.status] !== undefined) {
            byStatus[apt.status]++;
          }

          if (apt.status === AppointmentStatus.COMPLETED) {
            totalValue += Number(apt.actualCost || apt.estimatedCost || 0);
          }

          const aptDate = apt.appointmentDate
            ? new Date(apt.appointmentDate)
            : null;
          if (aptDate && !isNaN(aptDate.getTime())) {
            const dateKey = aptDate.toISOString().split('T')[0];
            if (!dailyMap.has(dateKey)) {
              dailyMap.set(dateKey, { count: 0, completed: 0 });
            }
            const dayStats = dailyMap.get(dateKey)!;
            dayStats.count++;
            if (apt.status === AppointmentStatus.COMPLETED) {
              dayStats.completed++;
            }
          }
        } catch (e) {
          // Skip invalid appointment
        }
      });

      const completionRate =
        appointments.length > 0
          ? byStatus[AppointmentStatus.COMPLETED] / appointments.length
          : 0;
      const cancellationRate =
        appointments.length > 0
          ? byStatus[AppointmentStatus.CANCELLED] / appointments.length
          : 0;
      const averageValue =
        byStatus[AppointmentStatus.COMPLETED] > 0
          ? totalValue / byStatus[AppointmentStatus.COMPLETED]
          : 0;

      const dailyTrend = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          count: stats.count,
          completed: stats.completed,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total: appointments.length,
        byStatus,
        completionRate,
        cancellationRate,
        averageValue,
        dailyTrend,
      };
    } catch (error) {
      console.error('Error in getAppointmentStatistics:', error);
      return {
        total: 0,
        byStatus: {
          [AppointmentStatus.PENDING]: 0,
          [AppointmentStatus.CONFIRMED]: 0,
          [AppointmentStatus.IN_PROGRESS]: 0,
          [AppointmentStatus.COMPLETED]: 0,
          [AppointmentStatus.CANCELLED]: 0,
        },
        completionRate: 0,
        cancellationRate: 0,
        averageValue: 0,
        dailyTrend: [],
      };
    }
  }

  /**
   * Returns top N services by booking count or revenue.
   */
  async getTopServices(
    limit: number,
    startDate: Date,
    endDate: Date,
    sortBy: 'count' | 'revenue' = 'revenue',
  ): Promise<
    Array<{
      serviceId: number;
      serviceName: string;
      bookingCount: number;
      completedCount: number;
      revenue: number;
      averagePrice: number;
    }>
  > {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
      relations: ['appointmentServices', 'appointmentServices.service'],
    });

    const serviceMap = new Map<
      number,
      {
        serviceId: number;
        serviceName: string;
        bookingCount: number;
        completedCount: number;
        revenue: number;
      }
    >();

    appointments.forEach((apt) => {
      // Process each service in the appointment
      const appointmentServices = apt.appointmentServices || [];
      appointmentServices.forEach((aptService) => {
        const key = aptService.serviceId;
        if (!serviceMap.has(key)) {
          serviceMap.set(key, {
            serviceId: aptService.serviceId,
            serviceName: aptService.service?.serviceName || 'Unknown',
            bookingCount: 0,
            completedCount: 0,
            revenue: 0,
          });
        }

        const stats = serviceMap.get(key)!;
        stats.bookingCount++;
        if (apt.status === AppointmentStatus.COMPLETED) {
          stats.completedCount++;
          // Divide revenue by number of services in appointment
          const revenuePerService = Number(apt.actualCost || apt.estimatedCost || 0) / appointmentServices.length;
          stats.revenue += revenuePerService;
        }
      });
    });

    const services = Array.from(serviceMap.values()).map((s) => ({
      ...s,
      averagePrice: s.completedCount > 0 ? s.revenue / s.completedCount : 0,
    }));

    services.sort((a, b) => {
      if (sortBy === 'count') {
        return b.bookingCount - a.bookingCount;
      }
      return b.revenue - a.revenue;
    });

    return services.slice(0, limit);
  }

  /**
   * Calculates employee workload statistics for period.
   */
  async getEmployeeWorkloadReport(
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      employeeId: number;
      employeeName: string;
      role: string;
      totalAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      revenue: number;
      completionRate: number;
    }>
  > {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
      relations: ['employee'],
    });

    const employeeMap = new Map<
      number,
      {
        employeeId: number;
        employeeName: string;
        role: string;
        totalAppointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        revenue: number;
      }
    >();

    appointments.forEach((apt) => {
      const key = apt.employeeId;
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employeeId: apt.employeeId,
          employeeName: apt.employee?.fullName || 'Unknown',
          role: 'Employee',
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          revenue: 0,
        });
      }

      const stats = employeeMap.get(key)!;
      stats.totalAppointments++;
      if (apt.status === AppointmentStatus.COMPLETED) {
        stats.completedAppointments++;
        stats.revenue += Number(apt.actualCost || apt.estimatedCost || 0);
      }
      if (apt.status === AppointmentStatus.CANCELLED) {
        stats.cancelledAppointments++;
      }
    });

    return Array.from(employeeMap.values())
      .map((emp) => ({
        ...emp,
        completionRate:
          emp.totalAppointments > 0
            ? emp.completedAppointments / emp.totalAppointments
            : 0,
      }))
      .sort((a, b) => b.totalAppointments - a.totalAppointments);
  }

  /**
   * Generates customer behavior and retention metrics.
   */
  async getCustomerRetentionReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
    topCustomers: Array<{
      petOwnerId: number;
      ownerName: string;
      appointmentCount: number;
      totalSpent: number;
    }>;
  }> {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
        status: AppointmentStatus.COMPLETED,
      },
      relations: ['pet', 'pet.owner'],
    });

    const customerMap = new Map<
      number,
      {
        petOwnerId: number;
        ownerName: string;
        appointmentCount: number;
        totalSpent: number;
        firstVisit: Date;
      }
    >();

    appointments.forEach((apt) => {
      const ownerId = apt.pet?.ownerId;
      if (!ownerId) return;

      if (!customerMap.has(ownerId)) {
        customerMap.set(ownerId, {
          petOwnerId: ownerId,
          ownerName: apt.pet?.owner?.fullName || 'Unknown',
          appointmentCount: 0,
          totalSpent: 0,
          firstVisit: apt.appointmentDate,
        });
      }

      const stats = customerMap.get(ownerId)!;
      stats.appointmentCount++;
      stats.totalSpent += Number(apt.actualCost || apt.estimatedCost || 0);
      if (apt.appointmentDate < stats.firstVisit) {
        stats.firstVisit = apt.appointmentDate;
      }
    });

    const customers = Array.from(customerMap.values());
    const newCustomers = customers.filter(
      (c) => c.firstVisit >= startDate && c.firstVisit <= endDate,
    ).length;
    const returningCustomers = customers.filter(
      (c) => c.appointmentCount > 1,
    ).length;
    const retentionRate =
      customers.length > 0 ? returningCustomers / customers.length : 0;

    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(({ firstVisit, ...rest }) => rest);

    return {
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers,
      retentionRate,
      topCustomers,
    };
  }

  /**
   * Exports report in specified format (PDF, Excel, CSV).
   */
  async exportReport(report: any, format: string): Promise<any> {
    // TODO: Implement export report logic
    // 1. Format data for export
    // 2. Generate file in specified format
    // 3. Return file buffer
    throw new Error('Method not implemented');
  }

  /**
   * Gets dashboard overview with key metrics.
   */
  async getDashboard(): Promise<{
    today: {
      appointments: number;
      revenue: number;
      completedAppointments: number;
    };
    overview: {
      totalPets: number;
      totalOwners: number;
      totalEmployees: number;
      activeAppointments: number;
    };
    revenue: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      pendingInvoices: number;
    };
    recentActivity: {
      recentAppointments: Appointment[];
      pendingInvoices: Invoice[];
    };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's statistics
    const todayAppointments = await this.appointmentRepository.count({
      where: { appointmentDate: Between(today, tomorrow) },
    });

    const todayCompleted = await this.appointmentRepository.count({
      where: {
        appointmentDate: Between(today, tomorrow),
        status: AppointmentStatus.COMPLETED,
      },
    });

    const todayInvoices = await this.invoiceRepository.find({
      where: {
        issueDate: Between(today, tomorrow),
        status: InvoiceStatus.PAID,
      },
    });
    const todayRevenue = todayInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // Week statistics
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekInvoices = await this.invoiceRepository.find({
      where: {
        issueDate: Between(weekStart, tomorrow),
        status: InvoiceStatus.PAID,
      },
    });
    const weekRevenue = weekInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // Month statistics
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthInvoices = await this.invoiceRepository.find({
      where: {
        issueDate: Between(monthStart, tomorrow),
        status: InvoiceStatus.PAID,
      },
    });
    const monthRevenue = monthInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // Overview counts
    const totalPets = await this.petRepository.count();
    const totalOwners = await this.petOwnerRepository.count();
    const totalEmployees = await this.employeeRepository.count();
    const activeAppointments = await this.appointmentRepository.count({
      where: [
        { status: AppointmentStatus.PENDING },
        { status: AppointmentStatus.CONFIRMED },
        { status: AppointmentStatus.IN_PROGRESS },
      ],
    });

    // Pending invoices
    const pendingInvoicesCount = await this.invoiceRepository.count({
      where: { status: InvoiceStatus.PENDING },
    });

    // Recent activity
    const recentAppointments = await this.appointmentRepository.find({
      relations: ['pet', 'employee', 'appointmentServices', 'appointmentServices.service'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const pendingInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.PENDING },
      relations: ['appointment'],
      order: { issueDate: 'DESC' },
      take: 5,
    });

    return {
      today: {
        appointments: todayAppointments,
        revenue: todayRevenue,
        completedAppointments: todayCompleted,
      },
      overview: {
        totalPets,
        totalOwners,
        totalEmployees,
        activeAppointments,
      },
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
        pendingInvoices: pendingInvoicesCount,
      },
      recentActivity: {
        recentAppointments,
        pendingInvoices,
      },
    };
  }

  /**
   * Generates service performance analysis.
   */
  async getServicePerformanceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      serviceId: number;
      serviceName: string;
      category: string;
      totalBookings: number;
      completedBookings: number;
      revenue: number;
      averagePrice: number;
      completionRate: number;
    }>
  > {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
      relations: ['appointmentServices', 'appointmentServices.service'],
    });

    const serviceMap = new Map<
      number,
      {
        serviceId: number;
        serviceName: string;
        category: string;
        totalBookings: number;
        completedBookings: number;
        revenue: number;
      }
    >();

    appointments.forEach((apt) => {
      // Process each service in the appointment
      const appointmentServices = apt.appointmentServices || [];
      appointmentServices.forEach((aptService) => {
        const key = aptService.serviceId;
        if (!serviceMap.has(key)) {
          serviceMap.set(key, {
            serviceId: aptService.serviceId,
            serviceName: aptService.service?.serviceName || 'Unknown',
            category: 'Service',
            totalBookings: 0,
            completedBookings: 0,
            revenue: 0,
          });
        }

        const stats = serviceMap.get(key)!;
        stats.totalBookings++;
        if (apt.status === AppointmentStatus.COMPLETED) {
          stats.completedBookings++;
          // Divide revenue by number of services in appointment
          const revenuePerService = Number(apt.actualCost || apt.estimatedCost || 0) / appointmentServices.length;
          stats.revenue += revenuePerService;
        }
      });
    });

    return Array.from(serviceMap.values())
      .map((s) => ({
        ...s,
        averagePrice:
          s.completedBookings > 0 ? s.revenue / s.completedBookings : 0,
        completionRate:
          s.totalBookings > 0 ? s.completedBookings / s.totalBookings : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  // Private helper methods

  /**
   * Aggregates revenue, expenses, and payment data.
   */
  private async aggregateFinancialData(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // TODO: Implement financial data aggregation
    throw new Error('Method not implemented');
  }

  /**
   * Formats raw data into structured report with visualizations.
   */
  private formatReportData(rawData: any, reportType: string): any {
    // TODO: Implement report data formatting
    throw new Error('Method not implemented');
  }

  /**
   * Calculates percentage changes and trends.
   */
  private calculateTrends(currentData: any, previousData: any): any {
    // TODO: Implement trend calculation
    throw new Error('Method not implemented');
  }
}
