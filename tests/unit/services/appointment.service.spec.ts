import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentService } from '../../../src/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { AppointmentService as AppointmentServiceEntity } from '../../../src/entities/appointment-service.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { Service } from '../../../src/entities/service.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { InvoiceService } from '../../../src/services/invoice.service';
import { CreateAppointmentDto } from '../../../src/dto/appointment/create-appointment.dto';
import { UserType } from '../../../src/entities/account.entity';

// ===== Use new test helpers =====
import { createMockRepository, createMockDataSource, createMockInvoiceService } from '../../helpers';

describe('AppointmentService - Phase 1 Unit Tests', () => {
  let service: AppointmentService;

  // ===== Use helper types for cleaner declarations =====
  let appointmentRepository: ReturnType<typeof createMockRepository<Appointment>>;
  let appointmentServiceRepository: ReturnType<typeof createMockRepository<AppointmentServiceEntity>>;
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;
  let serviceRepository: ReturnType<typeof createMockRepository<Service>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let invoiceService: ReturnType<typeof createMockInvoiceService>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    // ===== BEFORE: 15 lines of inline mock setup =====
    // const mockRepository = () => ({
    //   findOne: jest.fn(),
    //   find: jest.fn(),
    //   ...
    // });

    // ===== AFTER: Use shared helpers - consistent mock behavior =====
    appointmentRepository = createMockRepository<Appointment>();
    appointmentServiceRepository = createMockRepository<AppointmentServiceEntity>();
    petRepository = createMockRepository<Pet>();
    employeeRepository = createMockRepository<Employee>();
    serviceRepository = createMockRepository<Service>();
    petOwnerRepository = createMockRepository<PetOwner>();
    invoiceService = createMockInvoiceService();
    dataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(AppointmentServiceEntity),
          useValue: appointmentServiceRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
        {
          provide: InvoiceService,
          useValue: invoiceService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createAppointment (8 tests)', () => {
    const mockPet = { petId: 1, name: 'Max', ownerId: 1 } as Pet;
    const mockEmployee = { employeeId: 1, fullName: 'Dr. Smith' } as Employee;
    const mockService = { serviceId: 1, serviceName: 'Checkup', basePrice: 100 } as Service;
    const mockPetOwner = { petOwnerId: 1, accountId: 1 } as PetOwner;

    const validDto: CreateAppointmentDto = {
      petId: 1,
      employeeId: 1,
      services: [{ serviceId: 1, quantity: 1 }],
      appointmentDate: '2026-01-10',
      startTime: '10:00',
      endTime: '11:00',
    };

    it('[P0-1] should create appointment with single service successfully', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      serviceRepository.findOne.mockResolvedValue(mockService);
      appointmentRepository.findOne.mockResolvedValue(null); // No conflict

      const mockAppointment = {
        appointmentId: 1,
        petId: 1,
        employeeId: 1,
        appointmentDate: new Date('2026-01-10'),
        startTime: '10:00',
        endTime: '11:00',
        status: AppointmentStatus.PENDING,
        estimatedCost: 100,
        appointmentServices: [
          {
            serviceId: 1,
            quantity: 1,
            unitPrice: 100,
            service: mockService,
          },
        ],
      } as Appointment;

      // Mock transaction to execute callback and return result
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn((entity, data) => data),
          save: jest.fn().mockResolvedValue({ ...mockAppointment, appointmentId: 1 }),
          findOne: jest.fn().mockResolvedValue(mockAppointment),
        };
        return await callback(mockManager);
      });

      const result = await service.createAppointment(validDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(AppointmentStatus.PENDING);
      expect(petRepository.findOne).toHaveBeenCalledWith({ where: { petId: 1 } });
      expect(employeeRepository.findOne).toHaveBeenCalledWith({ where: { employeeId: 1 } });
      expect(serviceRepository.findOne).toHaveBeenCalledWith({ where: { serviceId: 1 } });
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('[P0-2] should calculate total cost correctly for multi-service appointment', async () => {
      const mockBath = { serviceId: 1, serviceName: 'Bath', basePrice: 100 } as Service;
      const mockCheckup = { serviceId: 2, serviceName: 'Checkup', basePrice: 150 } as Service;

      const multiServiceDto: CreateAppointmentDto = {
        petId: 1,
        employeeId: 1,
        services: [
          { serviceId: 1, quantity: 2 }, // Bath x2 = 200
          { serviceId: 2, quantity: 1 }, // Checkup x1 = 150
        ], // Total = 350
        appointmentDate: '2026-01-10',
        startTime: '10:00',
        endTime: '11:00',
      };

      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      appointmentRepository.findOne.mockResolvedValue(null);

      // Mock service lookups
      serviceRepository.findOne
        .mockResolvedValueOnce(mockBath)
        .mockResolvedValueOnce(mockCheckup);

      let capturedAppointment: any;
      const mockAppointment = {
        appointmentId: 1,
        petId: 1,
        employeeId: 1,
        estimatedCost: 350,
        status: AppointmentStatus.PENDING,
        appointmentServices: [
          { serviceId: 1, quantity: 2, unitPrice: 100, service: mockBath },
          { serviceId: 2, quantity: 1, unitPrice: 150, service: mockCheckup },
        ],
      } as Appointment;

      // Mock transaction to capture what's created
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn((entity, data) => {
            if (entity === Appointment) {
              capturedAppointment = data;
            }
            return data;
          }),
          save: jest.fn().mockResolvedValue({ ...mockAppointment, appointmentId: 1 }),
          findOne: jest.fn().mockResolvedValue(mockAppointment),
        };
        return await callback(mockManager);
      });

      const result = await service.createAppointment(multiServiceDto);

      expect(serviceRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      // Verify total cost calculation: 100*2 + 150*1 = 350
      // NOTE: This will FAIL if implementation bug exists (uses service.basePrice instead of totalEstimatedCost)
      expect(capturedAppointment.estimatedCost).toBe(350);
    });

    it('[P0-3] should throw 404 when pet does not exist', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.createAppointment(validDto)).rejects.toThrow();
      expect(employeeRepository.findOne).not.toHaveBeenCalled();
    });

    it('[P0-4] should throw 404 when PET_OWNER creates appointment for pet they do not own', async () => {
      const user = { accountId: 999, userType: UserType.PET_OWNER };

      petRepository.findOne.mockResolvedValue(mockPet); // Pet belongs to ownerId: 1
      petOwnerRepository.findOne.mockResolvedValue({ petOwnerId: 999, accountId: 999 } as PetOwner);

      await expect(service.createAppointment(validDto, user)).rejects.toThrow();
    });

    it('[P0-5] should throw 404 when employee does not exist', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.createAppointment(validDto)).rejects.toThrow();
    });

    it('[P0-6] should throw 404 when service does not exist', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(service.createAppointment(validDto)).rejects.toThrow();
    });

    it('[P0-7] should throw 400 when endTime <= startTime', async () => {
      const invalidDto = {
        ...validDto,
        startTime: '10:00',
        endTime: '09:00', // End before start
      };

      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      serviceRepository.findOne.mockResolvedValue(mockService);

      await expect(service.createAppointment(invalidDto)).rejects.toThrow();
    });

    it('[P0-8] should throw 409 when time slot conflicts with existing appointment', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      serviceRepository.findOne.mockResolvedValue(mockService);

      // Existing appointment: 09:30-10:30 overlaps with requested 10:00-11:00
      const existingAppointment = {
        appointmentId: 99,
        employeeId: 1,
        appointmentDate: new Date('2026-01-10'),
        startTime: '09:30',
        endTime: '10:30',
        status: AppointmentStatus.CONFIRMED,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(existingAppointment);

      await expect(service.createAppointment(validDto)).rejects.toThrow();
    });
  });

  describe('P0: confirmAppointment (2 tests)', () => {
    it('[P0-9] should transition appointment from PENDING to CONFIRMED', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
      } as Appointment);

      const result = await service.confirmAppointment(1);

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.CONFIRMED })
      );
    });

    it('[P0-10] should throw 400 when appointment is not in PENDING status', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.COMPLETED,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.confirmAppointment(1)).rejects.toThrow();
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('P0: completeAppointment (2 tests)', () => {
    it('[P0-11] should complete appointment and call invoiceService.createInvoice', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.IN_PROGRESS,
      } as Appointment;

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(mockAppointment),
          save: jest.fn().mockResolvedValue({
            ...mockAppointment,
            status: AppointmentStatus.COMPLETED,
          }),
        },
      };

      dataSource.createQueryRunner.mockReturnValue(queryRunner as any);
      invoiceService.createInvoice.mockResolvedValue({} as any);

      const result = await service.completeAppointment(1);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ appointmentId: 1 }),
        queryRunner.manager
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('[P0-12] should throw 400 and rollback when appointment is not IN_PROGRESS', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(mockAppointment),
        },
      };

      dataSource.createQueryRunner.mockReturnValue(queryRunner as any);

      await expect(service.completeAppointment(1)).rejects.toThrow();
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('P1: updateAppointment (6 tests)', () => {
    const mockAppointment: Appointment = {
      appointmentId: 1,
      petId: 1,
      employeeId: 1,
      appointmentDate: new Date('2026-01-10'),
      startTime: '10:00',
      endTime: '11:00',
      status: AppointmentStatus.PENDING,
    } as Appointment;

    it('[P1-1] should update appointment successfully', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      employeeRepository.findOne.mockResolvedValue({ employeeId: 2 } as Employee);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        employeeId: 2,
        startTime: '14:00',
        endTime: '15:00',
      } as Appointment);

      const result = await service.updateAppointment(1, {
        employeeId: 2,
        startTime: '14:00',
        endTime: '15:00',
      });

      expect(result.employeeId).toBe(2);
      expect(result.startTime).toBe('14:00');
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('[P1-2] should throw 404 when appointment does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAppointment(999, { startTime: '14:00' })).rejects.toThrow();
    });

    it('[P1-3] should throw 404 when new employee does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAppointment(1, { employeeId: 999 })).rejects.toThrow();
    });

    it('[P1-4] should throw 400 when endTime <= startTime', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(
        service.updateAppointment(1, { startTime: '15:00', endTime: '14:00' })
      ).rejects.toThrow();
    });

    it('[P1-5] should throw 400 when updating only endTime to be <= existing startTime', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.updateAppointment(1, { endTime: '09:00' })).rejects.toThrow();
    });

    it('[P1-6] should allow partial updates (only notes)', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        notes: 'Updated notes',
      } as Appointment);

      const result = await service.updateAppointment(1, { notes: 'Updated notes' });

      expect(result.notes).toBe('Updated notes');
      expect(appointmentRepository.save).toHaveBeenCalled();
    });
  });

  describe('P1: startAppointment (2 tests)', () => {
    it('[P1-7] should transition from CONFIRMED to IN_PROGRESS', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.CONFIRMED,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_PROGRESS,
      } as Appointment);

      const result = await service.startAppointment(1);

      expect(result.status).toBe(AppointmentStatus.IN_PROGRESS);
    });

    it('[P1-8] should throw 400 when appointment is not CONFIRMED', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.startAppointment(1)).rejects.toThrow();
    });
  });

  describe('P1: cancelAppointment (2 tests)', () => {
    it('[P1-9] should cancel appointment and set cancellation reason', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'Owner request',
        cancelledAt: new Date(),
      } as Appointment);

      const result = await service.cancelAppointment(1, 'Owner request');

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(result.cancellationReason).toBe('Owner request');
      expect(result.cancelledAt).toBeDefined();
    });

    it('[P1-10] should throw 400 when trying to cancel COMPLETED appointment', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.COMPLETED,
        pet: { petId: 1, ownerId: 1 } as Pet,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.cancelAppointment(1, 'Late cancel')).rejects.toThrow();
    });
  });

  describe('P1: getAppointmentById (3 tests)', () => {
    it('[P1-11] should return appointment with relations', async () => {
      const mockAppointment = {
        appointmentId: 1,
        pet: { petId: 1, name: 'Max' },
        employee: { employeeId: 1, fullName: 'Dr. Smith' },
        service: { serviceId: 1, serviceName: 'Checkup' },
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.getAppointmentById(1);

      expect(result).toBeDefined();
      expect(result.pet).toBeDefined();
      expect(result.employee).toBeDefined();
      expect(appointmentRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 1 },
        relations: ['pet', 'employee', 'appointmentServices', 'pet.owner'],
      });
    });

    it('[P1-12] should throw 404 when appointment does not exist', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.getAppointmentById(999)).rejects.toThrow();
    });

    it('[P1-13] should throw 404 when PET_OWNER queries appointment they do not own', async () => {
      const mockAppointment = {
        appointmentId: 1,
        pet: { petId: 1, ownerId: 99 } as Pet,
      } as Appointment;

      const user = { accountId: 1, userType: UserType.PET_OWNER };
      const mockPetOwner = { petOwnerId: 1, accountId: 1 } as PetOwner;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);

      await expect(service.getAppointmentById(1, user)).rejects.toThrow();
    });
  });

  describe('P1: deleteAppointment (2 tests)', () => {
    it('[P1-14] should delete PENDING appointment', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.PENDING,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentRepository.remove.mockResolvedValue(mockAppointment);

      await service.deleteAppointment(1);

      expect(appointmentRepository.remove).toHaveBeenCalledWith(mockAppointment);
    });

    it('[P1-15] should throw 400 when trying to delete non-PENDING appointment', async () => {
      const mockAppointment = {
        appointmentId: 1,
        status: AppointmentStatus.CONFIRMED,
      } as Appointment;

      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.deleteAppointment(1)).rejects.toThrow();
      expect(appointmentRepository.remove).not.toHaveBeenCalled();
    });
  });
});

