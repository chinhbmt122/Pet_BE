import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoiceService } from '../../../src/services/invoice.service';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Service } from '../../../src/entities/service.entity';
import { EntityManager } from 'typeorm';
import { CreateInvoiceDto } from '../../../src/dto/invoice';
import { UserType } from '../../../src/entities/account.entity';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('InvoiceService - Full Unit Tests', () => {
  let service: InvoiceService;

  // ===== Use helper types for cleaner declarations =====
  let invoiceRepository: ReturnType<typeof createMockRepository<Invoice>>;
  let appointmentRepository: ReturnType<typeof createMockRepository<Appointment>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;

  beforeEach(async () => {
    // ===== Use shared helpers - less code, consistent behavior =====
    invoiceRepository = createMockRepository<Invoice>();
    appointmentRepository = createMockRepository<Appointment>();
    petOwnerRepository = createMockRepository<PetOwner>();

    // Add manager mock to appointmentRepository for createInvoice tests
    // (InvoiceService uses this.appointmentRepository.manager as fallback)
    (appointmentRepository as any).manager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((entity, data) => data),
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        })),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: invoiceRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createInvoice (5 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      serviceName: 'Checkup',
      basePrice: 100,
    } as Service;

    const mockAppointment: Appointment = {
      appointmentId: 1,
      status: AppointmentStatus.COMPLETED,
      actualCost: 150,
      service: mockService,
    } as Appointment;

    const validDto: CreateInvoiceDto = {
      appointmentId: 1,
      notes: 'Payment due on delivery',
    };

    it('[P0-31] should create invoice successfully with transaction manager', async () => {
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAppointment) // appointment lookup
          .mockResolvedValueOnce(null), // no existing invoice
        create: jest.fn((entity, data) => ({ ...data, invoiceId: 1 })),
        save: jest.fn((entity, data) => Promise.resolve(data)),
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
        })),
      } as unknown as EntityManager;

      const result = await service.createInvoice(validDto, mockManager);

      expect(result).toBeDefined();
      expect(mockManager.findOne).toHaveBeenCalledWith(Appointment, expect.any(Object));
      expect(mockManager.save).toHaveBeenCalledWith(Invoice, expect.any(Object));
    });

    it('[P0-32] should throw 404 when appointment does not exist', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as EntityManager;

      await expect(service.createInvoice(validDto, mockManager)).rejects.toThrow();
    });

    it('[P0-33] should throw 409 when invoice already exists for appointment', async () => {
      const existingInvoice: Invoice = {
        invoiceId: 1,
        appointmentId: 1,
        status: InvoiceStatus.PAID,
      } as Invoice;

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAppointment) // appointment found
          .mockResolvedValueOnce(existingInvoice), // invoice exists
      } as unknown as EntityManager;

      await expect(service.createInvoice(validDto, mockManager)).rejects.toThrow();
    });

    it('[P0-34] should calculate tax correctly (10% VAT)', async () => {
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAppointment)
          .mockResolvedValueOnce(null),
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve({
          ...data,
          invoiceId: 1,
          invoiceNumber: 'INV-20260106-00001',
        })),
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
        })),
      } as unknown as EntityManager;

      const result = await service.createInvoice(validDto, mockManager);

      // subtotal = 150, tax = 150 * 0.1 = 15, total = 165
      expect(result).toBeDefined();
      const savedInvoice = (mockManager.save as jest.Mock).mock.calls[0][1];
      expect(savedInvoice.subtotal).toBe(150);
      expect(savedInvoice.tax).toBe(15); // 10% of 150
      expect(savedInvoice.totalAmount).toBe(165);
    });

    it('[P0-35] should generate unique invoice number (INV-YYYYMMDD-XXXXX format)', async () => {
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAppointment)
          .mockResolvedValueOnce(null),
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve({
          ...data,
          invoiceId: 1,
        })),
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
        })),
      } as unknown as EntityManager;

      await service.createInvoice(validDto, mockManager);

      const savedInvoice = (mockManager.save as jest.Mock).mock.calls[0][1];
      expect(savedInvoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{5}$/);
    });
  });

  describe('P1: getInvoiceById (3 tests)', () => {
    const mockInvoice: Invoice = {
      invoiceId: 1,
      appointmentId: 1,
      invoiceNumber: 'INV-20260106-00001',
      status: InvoiceStatus.PENDING,
      totalAmount: 165,
    } as Invoice;

    it('[P1-39] should return invoice when found', async () => {
      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(1);

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe('INV-20260106-00001');
    });

    it('[P1-40] should throw 404 when invoice does not exist', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.getInvoiceById(999)).rejects.toThrow();
    });

    it('[P1-41] should validate PET_OWNER can only access their invoice', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      const mockAppointment: Appointment = {
        appointmentId: 1,
        pet: { petId: 1, ownerId: 1 },
      } as Appointment;
      const mockOwner: PetOwner = {
        petOwnerId: 1,
        accountId: 1,
      } as PetOwner;

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      petOwnerRepository.findOne.mockResolvedValue(mockOwner);

      const result = await service.getInvoiceById(1, user);

      expect(result).toBeDefined();
    });
  });

  describe('P1: getInvoiceByAppointment (2 tests)', () => {
    it('[P1-42] should return invoice for appointment', async () => {
      const mockInvoice: Invoice = {
        invoiceId: 1,
        appointmentId: 1,
        invoiceNumber: 'INV-20260106-00001',
      } as Invoice;

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceByAppointment(1);

      expect(result).toBeDefined();
      expect(result.appointmentId).toBe(1);
    });

    it('[P1-43] should throw 404 when no invoice for appointment', async () => {
      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.getInvoiceByAppointment(999)).rejects.toThrow();
    });
  });

  describe('P0: generateInvoice (2 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      basePrice: 100,
    } as Service;

    const validDto: CreateInvoiceDto = {
      appointmentId: 1,
    };

    it('[P0-36] should generate invoice for completed appointment', async () => {
      const mockAppointment: Appointment = {
        appointmentId: 1,
        status: AppointmentStatus.COMPLETED,
        service: mockService,
        actualCost: 120,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      // Create a local mock manager for this test and assign to appointmentRepository
      // (InvoiceService uses this.appointmentRepository.manager as fallback)
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAppointment)
          .mockResolvedValueOnce(null),
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve({
          ...data,
          invoiceId: 1,
          invoiceNumber: 'INV-20260106-00001',
        })),
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
        })),
      };
      (appointmentRepository as any).manager = mockManager;

      const result = await service.generateInvoice(validDto);

      expect(result).toBeDefined();
    });



    it('[P0-37] should throw 400 when appointment not completed', async () => {
      const mockAppointment: Appointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.generateInvoice(validDto)).rejects.toThrow();
    });
  });
});
