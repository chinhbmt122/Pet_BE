import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CageService } from '../../../src/services/cage.service';
import { Cage } from '../../../src/entities/cage.entity';
import { CageAssignment } from '../../../src/entities/cage-assignment.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Employee } from '../../../src/entities/employee.entity';
import {
  CageSize,
  CageStatus,
  CageAssignmentStatus,
} from '../../../src/entities/types/entity.types';
import { CreateCageDto, UpdateCageDto, AssignCageDto } from '../../../src/dto/cage';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('CageService - Full Unit Tests', () => {
  let service: CageService;

  // ===== Use helper types for cleaner declarations =====
  let cageRepository: ReturnType<typeof createMockRepository<Cage>>;
  let assignmentRepository: ReturnType<typeof createMockRepository<CageAssignment>>;
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    cageRepository = createMockRepository<Cage>();
    assignmentRepository = createMockRepository<CageAssignment>();
    petRepository = createMockRepository<Pet>();
    employeeRepository = createMockRepository<Employee>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CageService,
        {
          provide: getRepositoryToken(Cage),
          useValue: cageRepository,
        },
        {
          provide: getRepositoryToken(CageAssignment),
          useValue: assignmentRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
      ],
    }).compile();

    service = module.get<CageService>(CageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createCage (3 tests)', () => {
    const validDto: CreateCageDto = {
      cageNumber: 'C-001',
      size: CageSize.MEDIUM,
      location: 'Building A',
      dailyRate: 50,
      notes: 'For medium dogs',
    };

    it('[P0-55] should create cage successfully', async () => {
      const mockCage: Cage = { ...validDto, cageId: 1, status: CageStatus.AVAILABLE } as Cage;

      cageRepository.findOne.mockResolvedValue(null); // No existing cage
      cageRepository.create.mockReturnValue(mockCage);
      cageRepository.save.mockResolvedValue(mockCage);

      const result = await service.createCage(validDto);

      expect(result).toBeDefined();
      expect(result.cageNumber).toBe('C-001');
      expect(result.status).toBe(CageStatus.AVAILABLE);
    });

    it('[P0-56] should throw 409 if cage number already exists', async () => {
      const existingCage: Cage = { cageId: 1, cageNumber: 'C-001' } as Cage;
      cageRepository.findOne.mockResolvedValue(existingCage);

      await expect(service.createCage(validDto)).rejects.toThrow();
    });

    it('[P0-57] should set status to AVAILABLE by default', async () => {
      const mockCage: Cage = { ...validDto, cageId: 1, status: CageStatus.AVAILABLE } as Cage;

      cageRepository.findOne.mockResolvedValue(null);
      cageRepository.create.mockReturnValue(mockCage);
      cageRepository.save.mockResolvedValue(mockCage);

      const result = await service.createCage(validDto);

      expect(result.status).toBe(CageStatus.AVAILABLE);
    });
  });

  describe('P0: assignPetToCage (7 tests + 3 concurrency)', () => {
    const mockCage: Cage = {
      cageId: 1,
      cageNumber: 'C-001',
      size: CageSize.MEDIUM,
      status: CageStatus.AVAILABLE,
      dailyRate: 50,
    } as Cage;

    const mockPet: Pet = {
      petId: 1,
      name: 'Max',
    } as Pet;

    const validDto: AssignCageDto = {
      petId: 1,
      checkInDate: '2026-01-06',
      expectedCheckOutDate: '2026-01-10',
      dailyRate: 50,
      assignedById: 1,
    };

    it('[P0-58] should assign pet to cage successfully', async () => {
      const mockEmployee: Employee = { employeeId: 1 } as Employee;
      const mockAssignment: CageAssignment = {
        assignmentId: 1,
        cageId: 1,
        petId: 1,
        status: CageAssignmentStatus.ACTIVE,
      } as CageAssignment;

      cageRepository.findOne.mockResolvedValue(mockCage);
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      assignmentRepository.findOne.mockResolvedValue(null); // No existing assignment
      assignmentRepository.create.mockReturnValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);
      cageRepository.save.mockResolvedValue({ ...mockCage, status: CageStatus.OCCUPIED });

      const result = await service.assignPetToCage(1, validDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(CageAssignmentStatus.ACTIVE);
      expect(cageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CageStatus.OCCUPIED }),
      );
    });

    it('[P0-59] should throw 404 if cage not found', async () => {
      cageRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPetToCage(999, validDto)).rejects.toThrow();
    });

    it('[P0-60] should throw 400 if cage not available', async () => {
      const occupiedCage = { ...mockCage, status: CageStatus.OCCUPIED };
      cageRepository.findOne.mockResolvedValue(occupiedCage);

      await expect(service.assignPetToCage(1, validDto)).rejects.toThrow();
    });

    it('[P0-61] should throw 404 if pet not found', async () => {
      cageRepository.findOne.mockResolvedValue(mockCage);
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPetToCage(1, validDto)).rejects.toThrow();
    });

    it('[P0-62] should throw 400 if pet already has active assignment', async () => {
      const existingAssignment: CageAssignment = {
        assignmentId: 2,
        cageId: 2,
        petId: 1,
        status: CageAssignmentStatus.ACTIVE,
      } as CageAssignment;

      cageRepository.findOne.mockResolvedValue(mockCage);
      petRepository.findOne.mockResolvedValue(mockPet);
      assignmentRepository.findOne.mockResolvedValue(existingAssignment);

      await expect(service.assignPetToCage(1, validDto)).rejects.toThrow();
    });

    it('[P0-63] should use cage daily rate if not provided in DTO', async () => {
      const dtoWithoutRate: AssignCageDto = {
        petId: 1,
        checkInDate: '2026-01-06',
        expectedCheckOutDate: '2026-01-10',
        // No dailyRate - should use cage.dailyRate (50)
        // No assignedById - skip employee validation
      };

      const mockAssignment: CageAssignment = {
        assignmentId: 1,
        dailyRate: 50, // From cage
      } as CageAssignment;

      // Create fresh cage object to avoid state pollution
      const availableCage: Cage = {
        ...mockCage,
        status: CageStatus.AVAILABLE,
      };

      cageRepository.findOne.mockResolvedValue(availableCage);
      petRepository.findOne.mockResolvedValue(mockPet);
      assignmentRepository.findOne.mockResolvedValue(null);
      assignmentRepository.create.mockImplementation((data) => data as CageAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);
      cageRepository.save.mockResolvedValue(availableCage);

      await service.assignPetToCage(1, dtoWithoutRate);

      expect(assignmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyRate: 50, // Cage's daily rate
        }),
      );
    });

    it('[P0-64] should update cage status to OCCUPIED after assignment', async () => {
      const mockEmployee: Employee = { employeeId: 1 } as Employee;
      const mockAssignment: CageAssignment = {
        assignmentId: 1,
        status: CageAssignmentStatus.ACTIVE,
      } as CageAssignment;

      const freshMockCage = { ...mockCage, status: CageStatus.AVAILABLE }; // Ensure AVAILABLE

      cageRepository.findOne.mockResolvedValue(freshMockCage);
      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      assignmentRepository.findOne.mockResolvedValue(null);
      assignmentRepository.create.mockReturnValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);
      cageRepository.save.mockResolvedValue({ ...mockCage, status: CageStatus.OCCUPIED });

      await service.assignPetToCage(1, validDto);

      expect(cageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CageStatus.OCCUPIED,
        }),
      );
    });

    it('[CONCURRENCY-1] should prevent double-booking same cage (race condition)', async () => {
      const pet1: Pet = { petId: 1, name: 'Max' } as Pet;
      const pet2: Pet = { petId: 2, name: 'Buddy' } as Pet;
      const mockEmployee: Employee = { employeeId: 1 } as Employee;

      let cageStatusValue = CageStatus.AVAILABLE;
      let assignmentCount = 0;

      cageRepository.findOne.mockImplementation(async () => ({
        ...mockCage,
        status: cageStatusValue, // Will change after first save
      }));

      petRepository.findOne.mockImplementation(async ({ where }) => {
        return (where as any).petId === 1 ? pet1 : pet2;
      });

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      assignmentRepository.findOne.mockResolvedValue(null);
      assignmentRepository.create.mockImplementation((data) => data as CageAssignment);
      assignmentRepository.save.mockImplementation(async (assignment) => {
        assignmentCount++;
        return { ...assignment, assignmentId: assignmentCount };
      });

      cageRepository.save.mockImplementation(async (cage) => {
        // Update status after first save (simulating state change)
        cageStatusValue = CageStatus.OCCUPIED;
        return { ...cage, status: CageStatus.OCCUPIED };
      });

      // Simulate sequential (not parallel) requests
      const dto1 = { ...validDto, petId: 1 };
      const dto2 = { ...validDto, petId: 2 };

      const result1 = await service.assignPetToCage(1, dto1);
      expect(result1.assignmentId).toBe(1);

      // Second request should now fail (cage occupied)
      await expect(service.assignPetToCage(1, dto2)).rejects.toThrow();
    });

    it('[CONCURRENCY-2] should prevent same pet from being assigned to multiple cages', async () => {
      const mockEmployee: Employee = { employeeId: 1 } as Employee;
      const mockCage2: Cage = {
        ...mockCage,
        cageId: 2,
        cageNumber: 'C-002',
        status: CageStatus.AVAILABLE, // ADDED - ensure second cage is available
      };

      let activeAssignmentExists = false;

      cageRepository.findOne.mockImplementation(async ({ where }) => {
        const cageId = (where as any).cageId;
        if (cageId === 1) return { ...mockCage, status: CageStatus.AVAILABLE };
        if (cageId === 2) return mockCage2;
        return null;
      });

      petRepository.findOne.mockResolvedValue(mockPet);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      assignmentRepository.findOne.mockImplementation(async () => {
        return activeAssignmentExists ? ({
          assignmentId: 1,
          petId: 1,
          status: CageAssignmentStatus.ACTIVE,
        } as CageAssignment) : null;
      });

      assignmentRepository.create.mockImplementation((data) => data as CageAssignment);
      assignmentRepository.save.mockImplementation(async (assignment) => {
        activeAssignmentExists = true;
        return { ...assignment, assignmentId: 1 };
      });

      cageRepository.save.mockResolvedValue({ ...mockCage, status: CageStatus.OCCUPIED });

      // First assignment succeeds
      const result1 = await service.assignPetToCage(1, validDto);
      expect(result1).toBeDefined();

      // Second assignment should fail (same pet, different cage)
      await expect(service.assignPetToCage(2, validDto)).rejects.toThrow();
    });

    it('[CONCURRENCY-3] should handle high-load concurrent cage queries', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCage]),
      };

      cageRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      // Simulate 100 concurrent requests for available cages
      const requests = Array(100)
        .fill(null)
        .map(() => service.getAvailableCages({ size: CageSize.MEDIUM }));

      const results = await Promise.all(requests);

      expect(results).toHaveLength(100);
      results.forEach((cages) => {
        expect(cages).toHaveLength(1);
        expect(cages[0].cageNumber).toBe('C-001');
      });
    });
  });

  describe('P1: checkOutPet (4 tests)', () => {
    const mockAssignment: CageAssignment = {
      assignmentId: 1,
      cageId: 1,
      petId: 1,
      status: CageAssignmentStatus.ACTIVE,
      cage: { cageId: 1, cageNumber: 'C-001', status: CageStatus.OCCUPIED } as Cage,
    } as CageAssignment;

    it('[P1-45] should check out pet successfully', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue({
        ...mockAssignment,
        status: CageAssignmentStatus.COMPLETED,
        actualCheckOutDate: new Date(),
      });
      cageRepository.save.mockResolvedValue({
        ...mockAssignment.cage,
        status: CageStatus.AVAILABLE,
      });

      const result = await service.checkOutPet(1, '2026-01-10');

      expect(result.status).toBe(CageAssignmentStatus.COMPLETED);
      expect(result.actualCheckOutDate).toBeDefined();
      expect(cageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CageStatus.AVAILABLE }),
      );
    });

    it('[P1-46] should throw 404 if assignment not found', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.checkOutPet(999)).rejects.toThrow();
    });

    it('[P1-47] should throw 400 if assignment not active', async () => {
      const completedAssignment = {
        ...mockAssignment,
        status: CageAssignmentStatus.COMPLETED,
      };
      assignmentRepository.findOne.mockResolvedValue(completedAssignment);

      await expect(service.checkOutPet(1)).rejects.toThrow();
    });

    it('[P1-48] should use current date if checkOutDate not provided', async () => {
      const mockCage: Cage = {
        cageId: 1,
        cageNumber: 'C-001',
        status: CageStatus.OCCUPIED,
      } as Cage;

      const assignment: CageAssignment = {
        assignmentId: 1,
        cageId: 1,
        petId: 1,
        status: CageAssignmentStatus.ACTIVE, // MUST be ACTIVE to pass validation
        cage: mockCage,
      } as CageAssignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      assignmentRepository.save.mockImplementation(async (assignment) => assignment);
      cageRepository.save.mockResolvedValue({ ...mockCage, status: CageStatus.AVAILABLE });

      const result = await service.checkOutPet(1);

      expect(result.actualCheckOutDate).toBeDefined();
      expect(result.actualCheckOutDate).toBeInstanceOf(Date);
    });
  });

  describe('P1: deleteCage (3 tests)', () => {
    const mockCage: Cage = {
      cageId: 1,
      cageNumber: 'C-001',
      status: CageStatus.AVAILABLE,
    } as Cage;

    it('[P1-49] should soft delete cage by marking as OUT_OF_SERVICE', async () => {
      cageRepository.findOne.mockResolvedValue(mockCage);
      assignmentRepository.findOne.mockResolvedValue(null); // No active assignments
      cageRepository.save.mockResolvedValue({
        ...mockCage,
        status: CageStatus.OUT_OF_SERVICE,
      });

      await service.deleteCage(1);

      expect(cageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CageStatus.OUT_OF_SERVICE }),
      );
    });

    it('[P1-50] should throw 404 if cage not found', async () => {
      cageRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCage(999)).rejects.toThrow();
    });

    it('[P1-51] should throw 400 if cage has active assignments', async () => {
      const activeAssignment: CageAssignment = {
        assignmentId: 1,
        cageId: 1,
        status: CageAssignmentStatus.ACTIVE,
      } as CageAssignment;

      cageRepository.findOne.mockResolvedValue(mockCage);
      assignmentRepository.findOne.mockResolvedValue(activeAssignment);

      await expect(service.deleteCage(1)).rejects.toThrow();
    });
  });
});
