import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from '../../../src/services/report.service';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';
import { Service } from '../../../src/entities/service.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { CageAssignment } from '../../../src/entities/cage-assignment.entity';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('ReportService - Full Unit Tests', () => {
  let service: ReportService;

  // ===== Use helper types for cleaner declarations =====
  let appointmentRepository: ReturnType<typeof createMockRepository<Appointment>>;
  let invoiceRepository: ReturnType<typeof createMockRepository<Invoice>>;
  let serviceRepository: ReturnType<typeof createMockRepository<Service>>;
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;
  let cageAssignmentRepository: ReturnType<typeof createMockRepository<CageAssignment>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    appointmentRepository = createMockRepository<Appointment>();
    invoiceRepository = createMockRepository<Invoice>();
    serviceRepository = createMockRepository<Service>();
    petRepository = createMockRepository<Pet>();
    petOwnerRepository = createMockRepository<PetOwner>();
    employeeRepository = createMockRepository<Employee>();
    cageAssignmentRepository = createMockRepository<CageAssignment>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: invoiceRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
        {
          provide: getRepositoryToken(CageAssignment),
          useValue: cageAssignmentRepository,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P2: generateFinancialReport (3 tests)', () => {
    it('[P2-09] should generate financial report with revenue breakdown', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const mockInvoices: Partial<Invoice>[] = [
        {
          invoiceId: 1,
          totalAmount: 100000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-01-10'),
        },
        {
          invoiceId: 2,
          totalAmount: 150000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-01-15'),
        },
        {
          invoiceId: 3,
          totalAmount: 50000,
          status: InvoiceStatus.PENDING,
          issueDate: new Date('2026-01-20'),
        },
      ];

      const mockAppointments: Partial<Appointment>[] = [
        {
          appointmentId: 1,
          status: AppointmentStatus.COMPLETED,
          actualCost: 100000,
          appointmentDate: new Date('2026-01-10'),
        },
        {
          appointmentId: 2,
          status: AppointmentStatus.COMPLETED,
          actualCost: 150000,
          appointmentDate: new Date('2026-01-15'),
        },
        {
          appointmentId: 3,
          status: AppointmentStatus.CANCELLED,
          estimatedCost: 75000,
          appointmentDate: new Date('2026-01-18'),
        },
      ];

      invoiceRepository.find.mockResolvedValue(mockInvoices as Invoice[]);
      appointmentRepository.find.mockResolvedValue(mockAppointments as Appointment[]);

      const result = await service.generateFinancialReport(startDate, endDate);

      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.revenue.total).toBe(250000); // 100k + 150k paid
      expect(result.revenue.byStatus[InvoiceStatus.PAID]).toBe(250000);
      expect(result.revenue.byStatus[InvoiceStatus.PENDING]).toBe(50000);
      expect(result.appointments.total).toBe(3);
      expect(result.appointments.completed).toBe(2);
      expect(result.appointments.cancelled).toBe(1);
      expect(result.summary.paidInvoices).toBe(2);
      expect(result.summary.pendingInvoices).toBe(1);
    });

    it('[P2-10] should calculate average appointment value correctly', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const mockInvoices: Partial<Invoice>[] = [];
      const mockAppointments: Partial<Appointment>[] = [
        {
          appointmentId: 1,
          status: AppointmentStatus.COMPLETED,
          actualCost: 200000,
          appointmentDate: new Date('2026-01-10'),
        },
        {
          appointmentId: 2,
          status: AppointmentStatus.COMPLETED,
          actualCost: 400000,
          appointmentDate: new Date('2026-01-15'),
        },
      ];

      invoiceRepository.find.mockResolvedValue(mockInvoices as Invoice[]);
      appointmentRepository.find.mockResolvedValue(mockAppointments as Appointment[]);

      const result = await service.generateFinancialReport(startDate, endDate);

      expect(result.appointments.averageValue).toBe(300000); // (200k + 400k) / 2
    });

    it('[P2-11] should handle empty data gracefully', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      invoiceRepository.find.mockResolvedValue([]);
      appointmentRepository.find.mockResolvedValue([]);

      const result = await service.generateFinancialReport(startDate, endDate);

      expect(result.revenue.total).toBe(0);
      expect(result.appointments.total).toBe(0);
      expect(result.appointments.averageValue).toBe(0);
      expect(result.summary.completionRate).toBe(0);
    });
  });

  describe('P2: getRevenueByPeriod (2 tests)', () => {
    it('[P2-12] should return monthly revenue breakdown', async () => {
      const mockInvoices: Partial<Invoice>[] = [
        {
          invoiceId: 1,
          totalAmount: 100000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-01-15'),
          appointment: {} as Appointment,
        },
        {
          invoiceId: 2,
          totalAmount: 150000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-02-10'),
          appointment: {} as Appointment,
        },
        {
          invoiceId: 3,
          totalAmount: 200000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-02-20'),
          appointment: {} as Appointment,
        },
      ];

      invoiceRepository.find.mockResolvedValue(mockInvoices as Invoice[]);

      const result = await service.getRevenueByPeriod('month', 2026);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should have aggregated data by month
    });

    it('[P2-13] should return quarterly revenue breakdown', async () => {
      const mockInvoices: Partial<Invoice>[] = [
        {
          invoiceId: 1,
          totalAmount: 100000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-01-15'),
          appointment: {} as Appointment,
        },
        {
          invoiceId: 2,
          totalAmount: 150000,
          status: InvoiceStatus.PAID,
          issueDate: new Date('2026-04-10'),
          appointment: {} as Appointment,
        },
      ];

      invoiceRepository.find.mockResolvedValue(mockInvoices as Invoice[]);

      const result = await service.getRevenueByPeriod('quarter', 2026);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('P2: getAppointmentStatistics (2 tests)', () => {
    it('[P2-14] should return appointment statistics by status', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const mockAppointments: Partial<Appointment>[] = [
        {
          appointmentId: 1,
          status: AppointmentStatus.COMPLETED,
          appointmentDate: new Date('2026-01-10'),
        },
        {
          appointmentId: 2,
          status: AppointmentStatus.PENDING,
          appointmentDate: new Date('2026-01-15'),
        },
        {
          appointmentId: 3,
          status: AppointmentStatus.CANCELLED,
          appointmentDate: new Date('2026-01-20'),
        },
      ];

      appointmentRepository.find.mockResolvedValue(mockAppointments as Appointment[]);

      const result = await service.getAppointmentStatistics(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.byStatus).toBeDefined();
    });

    it('[P2-15] should handle empty appointment data', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      appointmentRepository.find.mockResolvedValue([]);

      const result = await service.getAppointmentStatistics(startDate, endDate);

      expect(result.total).toBe(0);
    });
  });

  describe('P2: getTopServices (2 tests)', () => {
    it('[P2-16] should return top services by appointment count', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const mockAppointments: Partial<Appointment>[] = [
        {
          appointmentId: 1,
          status: AppointmentStatus.COMPLETED,
          actualCost: 100000,
          estimatedCost: 100000,
          appointmentDate: new Date('2026-01-10'),
          appointmentServices: [
            { serviceId: 1, service: { serviceName: 'Grooming' } },
          ] as any,
        },
        {
          appointmentId: 2,
          status: AppointmentStatus.COMPLETED,
          actualCost: 120000,
          estimatedCost: 120000,
          appointmentDate: new Date('2026-01-15'),
          appointmentServices: [
            { serviceId: 1, service: { serviceName: 'Grooming' } },
          ] as any,
        },
        {
          appointmentId: 3,
          status: AppointmentStatus.COMPLETED,
          actualCost: 200000,
          estimatedCost: 200000,
          appointmentDate: new Date('2026-01-20'),
          appointmentServices: [
            { serviceId: 2, service: { serviceName: 'Checkup' } },
          ] as any,
        },
      ];

      appointmentRepository.find.mockResolvedValue(mockAppointments as Appointment[]);

      const result = await service.getTopServices(5, startDate, endDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('[P2-17] should return empty array if no services found', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      appointmentRepository.find.mockResolvedValue([]);

      const result = await service.getTopServices(5, startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('P2: getDashboard (2 tests)', () => {
    it('[P2-18] should return dashboard summary with all metrics', async () => {
      // Mock all the repository calls needed for dashboard
      appointmentRepository.count.mockResolvedValue(100);
      invoiceRepository.count.mockResolvedValue(80);
      petRepository.count.mockResolvedValue(200);
      petOwnerRepository.count.mockResolvedValue(150);
      employeeRepository.count.mockResolvedValue(20);
      serviceRepository.count.mockResolvedValue(15);
      cageAssignmentRepository.count.mockResolvedValue(5);

      appointmentRepository.find.mockResolvedValue([
        { status: AppointmentStatus.PENDING } as Appointment,
        { status: AppointmentStatus.CONFIRMED } as Appointment,
      ]);

      invoiceRepository.find.mockResolvedValue([
        { status: InvoiceStatus.PAID, totalAmount: 100000 } as Invoice,
        { status: InvoiceStatus.PAID, totalAmount: 200000 } as Invoice,
      ]);

      const result = await service.getDashboard();

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
    });

    it('[P2-19] should handle dashboard with zero counts', async () => {
      // Mock all counts as zero
      appointmentRepository.count.mockResolvedValue(0);
      invoiceRepository.count.mockResolvedValue(0);
      petRepository.count.mockResolvedValue(0);
      petOwnerRepository.count.mockResolvedValue(0);
      employeeRepository.count.mockResolvedValue(0);
      serviceRepository.count.mockResolvedValue(0);
      cageAssignmentRepository.count.mockResolvedValue(0);

      appointmentRepository.find.mockResolvedValue([]);
      invoiceRepository.find.mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
    });
  });
});
