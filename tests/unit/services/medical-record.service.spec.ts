import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MedicalRecordService } from '../../../src/services/medical-record.service';
import { MedicalRecord } from '../../../src/entities/medical-record.entity';
import { VaccineType } from '../../../src/entities/vaccine-type.entity';
import { VaccinationHistory } from '../../../src/entities/vaccination-history.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { CreateMedicalRecordDto } from '../../../src/dto/medical-record/create-medical-record.dto';
import { CreateVaccinationDto } from '../../../src/dto/vaccination/create-vaccination.dto';
import { Appointment } from '../../../src/entities/appointment.entity';
import { OwnershipValidationHelper } from '../../../src/services/helpers/ownership-validation.helper';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

// Mock for OwnershipValidationHelper
const mockOwnershipHelper = {
  validatePetOwnership: jest.fn().mockResolvedValue(undefined),
  validateAppointmentOwnership: jest.fn().mockResolvedValue(undefined),
  userOwnsPet: jest.fn().mockResolvedValue(true),
  getPetOwnerByAccount: jest.fn().mockResolvedValue(null),
};

describe('MedicalRecordService', () => {
  let service: MedicalRecordService;

  // ===== Use helper types for cleaner declarations =====
  let medicalRecordRepository: ReturnType<typeof createMockRepository<MedicalRecord>>;
  let vaccineTypeRepository: ReturnType<typeof createMockRepository<VaccineType>>;
  let vaccinationHistoryRepository: ReturnType<typeof createMockRepository<VaccinationHistory>>;
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let veterinarianRepository: ReturnType<typeof createMockRepository<Veterinarian>>;

  const mockPet: Partial<Pet> = {
    petId: 1,
    name: 'Buddy',
    species: 'Dog',
  };

  const mockVeterinarian: Partial<Veterinarian> = {
    employeeId: 1,
    licenseNumber: 'VET123',
    expertise: 'General Practice',
  };

  const mockMedicalRecord: MedicalRecord = {
    recordId: 1,
    petId: 1,
    veterinarianId: 1,
    appointmentId: null,
    examinationDate: new Date(),
    diagnosis: 'Healthy checkup',
    treatment: 'None required',
    medicalSummary: { notes: 'Pet is healthy' },
    followUpDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as MedicalRecord;

  const mockVaccineType: Partial<VaccineType> = {
    vaccineTypeId: 1,
    vaccineName: 'Rabies',
    boosterIntervalMonths: 12,
    isActive: true,
  };

  const mockVaccinationHistory: VaccinationHistory = {
    vaccinationId: 1,
    petId: 1,
    vaccineTypeId: 1,
    administeredBy: 1,
    administrationDate: new Date(),
    nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    batchNumber: 'BATCH001',
    site: 'Left shoulder',
    reactions: null,
    notes: null,
    createdAt: new Date(),
  } as VaccinationHistory;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    medicalRecordRepository = createMockRepository<MedicalRecord>();
    vaccineTypeRepository = createMockRepository<VaccineType>();
    vaccinationHistoryRepository = createMockRepository<VaccinationHistory>();
    petRepository = createMockRepository<Pet>();
    veterinarianRepository = createMockRepository<Veterinarian>();

    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordService,
        {
          provide: getRepositoryToken(MedicalRecord),
          useValue: medicalRecordRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: createMockRepository<Appointment>(),
        },
        {
          provide: getRepositoryToken(VaccineType),
          useValue: vaccineTypeRepository,
        },
        {
          provide: getRepositoryToken(VaccinationHistory),
          useValue: vaccinationHistoryRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: getRepositoryToken(Veterinarian),
          useValue: veterinarianRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: createMockRepository<PetOwner>(),
        },
        {
          provide: OwnershipValidationHelper,
          useValue: mockOwnershipHelper,
        },
      ],
    }).compile();

    service = module.get<MedicalRecordService>(MedicalRecordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createMedicalRecord (3 tests)', () => {
    const createDto: CreateMedicalRecordDto = {
      petId: 1,
      veterinarianId: 1,
      diagnosis: 'Healthy checkup',
      treatment: 'None required',
    };

    it('[P0-108] should create medical record via domain model', async () => {
      petRepository.findOne.mockResolvedValue(mockPet as Pet);
      veterinarianRepository.findOne.mockResolvedValue(
        mockVeterinarian as Veterinarian,
      );
      medicalRecordRepository.create.mockReturnValue(mockMedicalRecord);
      medicalRecordRepository.save.mockResolvedValue(mockMedicalRecord);

      const result = await service.createMedicalRecord(createDto);

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { petId: 1 },
      });
      expect(veterinarianRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 1 },
      });
      expect(medicalRecordRepository.create).toHaveBeenCalled();
      expect(result.diagnosis).toBe('Healthy checkup');
      // Computed fields from domain model
      expect(typeof result.isFollowUpOverdue).toBe('boolean');
      expect(typeof result.needsFollowUp).toBe('boolean');
    });

    it('[P0-109] should throw NotFoundException when pet not found', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.createMedicalRecord(createDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.pet',
          }),
        }),
      );
    });

    it('should throw BadRequestException when vet not found', async () => {
      petRepository.findOne.mockResolvedValue(mockPet as Pet);
      veterinarianRepository.findOne.mockResolvedValue(null);

      await expect(service.createMedicalRecord(createDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.notVeterinarian',
          }),
        }),
      );
    });
  });

  describe('P0: addVaccination (4 tests)', () => {
    const createVaccinationDto: CreateVaccinationDto = {
      vaccineTypeId: 1,
      administeredBy: 1,
      administrationDate: new Date().toISOString(),
      batchNumber: 'BATCH001',
      site: 'Left shoulder',
    };

    it('[P0-111] should create vaccination with auto-calculated nextDueDate', async () => {
      petRepository.findOne.mockResolvedValue(mockPet as Pet);
      vaccineTypeRepository.findOne.mockResolvedValue(
        mockVaccineType as VaccineType,
      );
      veterinarianRepository.findOne.mockResolvedValue(
        mockVeterinarian as Veterinarian,
      );
      vaccinationHistoryRepository.create.mockReturnValue(
        mockVaccinationHistory,
      );
      vaccinationHistoryRepository.save.mockResolvedValue(
        mockVaccinationHistory,
      );
      vaccinationHistoryRepository.findOne.mockResolvedValue({
        ...mockVaccinationHistory,
        vaccineType: mockVaccineType,
      } as VaccinationHistory);

      const result = await service.addVaccination(1, createVaccinationDto);

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { petId: 1 },
      });
      expect(vaccineTypeRepository.findOne).toHaveBeenCalledWith({
        where: { vaccineTypeId: 1 },
      });
      expect(vaccinationHistoryRepository.create).toHaveBeenCalled();
      expect(result.nextDueDate).toBeDefined();
      // Computed fields from domain model
      expect(typeof result.isDue).toBe('boolean');
      expect(
        result.daysUntilDue === null || typeof result.daysUntilDue === 'number',
      ).toBe(true);
    });

    it('[P0-112] should throw NotFoundException when pet not found', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addVaccination(999, createVaccinationDto),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.pet',
          }),
        }),
      );
    });

    it('[P0-113] should throw NotFoundException when vaccine type not found', async () => {
      petRepository.findOne.mockResolvedValue(mockPet as Pet);
      vaccineTypeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addVaccination(1, createVaccinationDto),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.vaccineType',
          }),
        }),
      );
    });

    it('should throw BadRequestException when vet not found', async () => {
      petRepository.findOne.mockResolvedValue(mockPet as Pet);
      vaccineTypeRepository.findOne.mockResolvedValue(
        mockVaccineType as VaccineType,
      );
      veterinarianRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addVaccination(1, createVaccinationDto),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.notVeterinarian',
          }),
        }),
      );
    });
  });

  describe('P1: getVaccinationHistory (1 test)', () => {
    it('[P1-78] should return vaccination history with computed isDue', async () => {
      vaccinationHistoryRepository.find.mockResolvedValue([
        {
          ...mockVaccinationHistory,
          vaccineType: mockVaccineType,
        } as VaccinationHistory,
      ]);

      const result = await service.getVaccinationHistory(1);

      expect(vaccinationHistoryRepository.find).toHaveBeenCalledWith({
        where: { petId: 1 },
        order: { administrationDate: 'DESC' },
        relations: ['vaccineType', 'administrator', 'administrator.account'],
      });
      expect(result.length).toBe(1);
      expect(typeof result[0].isDue).toBe('boolean');
    });
  });

  describe('P1: getMedicalHistoryByPet (1 test)', () => {
    it('[P1-79] should return medical history in chronological order', async () => {
      medicalRecordRepository.find.mockResolvedValue([mockMedicalRecord]);

      const result = await service.getMedicalHistoryByPet(1);

      expect(medicalRecordRepository.find).toHaveBeenCalledWith({
        where: { petId: 1 },
        order: { examinationDate: 'DESC' },
        relations: ['veterinarian'],
      });
      expect(result.length).toBe(1);
      expect(result[0].isFollowUpOverdue).toBeDefined();
    });
  });

  describe('P2: updateMedicalRecord (1 test)', () => {
    it('[P2-22] should update medical record successfully', async () => {
      const updateDto = {
        diagnosis: 'Updated diagnosis',
        treatment: 'Updated treatment',
      };

      medicalRecordRepository.findOne.mockResolvedValue(mockMedicalRecord);
      medicalRecordRepository.save.mockResolvedValue({
        ...mockMedicalRecord,
        ...updateDto,
      });

      const result = await service.updateMedicalRecord(1, updateDto);

      expect(result).toBeDefined();
      expect(medicalRecordRepository.findOne).toHaveBeenCalledWith({
        where: { recordId: 1 },
      });
      expect(medicalRecordRepository.save).toHaveBeenCalled();
    });
  });

  describe('P2: getOverdueFollowUps (1 test)', () => {
    it('[P2-23] should return overdue follow-up records', async () => {
      const overdueRecord = {
        ...mockMedicalRecord,
        followUpDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };

      medicalRecordRepository.find.mockResolvedValue([overdueRecord]);

      const result = await service.getOverdueFollowUps();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
