import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PetModule } from '../../src/modules/pet.module';
import { MedicalRecordModule } from '../../src/modules/medical-record.module';
import { PetOwnerModule } from '../../src/modules/pet-owner.module';
import { PetService } from '../../src/services/pet.service';
import { MedicalRecordService } from '../../src/services/medical-record.service';
import { Pet } from '../../src/entities/pet.entity';
import { MedicalRecord } from '../../src/entities/medical-record.entity';
import { VaccinationHistory } from '../../src/entities/vaccination-history.entity';
import { PetOwner } from '../../src/entities/pet-owner.entity';
import { Account } from '../../src/entities/account.entity';
import { VaccineType } from '../../src/entities/vaccine-type.entity';
import { Veterinarian } from '../../src/entities/veterinarian.entity';
import { UserType, VaccineCategory } from '../../src/entities/types/entity.types';
import { getTestDatabaseConfig } from '../e2e/test-db.config';

/**
 * Epic 2 Integration Tests - Pet & Medical Domain
 *
 * Tests service-to-service interactions for:
 * - Pet lifecycle management (using DDD pattern with PetDomainModel)
 * - Medical record workflows (using MedicalRecordDomainModel)
 * - Vaccination tracking (using VaccinationHistoryDomainModel)
 * - Owner-pet relationships
 *
 * Updated to match refactored DDD service layer returning DTOs.
 */
describe('Epic 2 Integration Tests - Pet & Medical Domain', () => {
  let module: TestingModule;
  let petService: PetService;
  let medicalRecordService: MedicalRecordService;

  // Repositories for direct database operations and test setup
  let petRepository: Repository<Pet>;
  let medicalRecordRepository: Repository<MedicalRecord>;
  let vaccinationRepository: Repository<VaccinationHistory>;
  let petOwnerRepository: Repository<PetOwner>;
  let accountRepository: Repository<Account>;
  let vaccineTypeRepository: Repository<VaccineType>;
  let veterinarianRepository: Repository<Veterinarian>;

  // Test data IDs
  let testOwnerId: number;
  let testPetId: number;
  let testMedicalRecordId: number;
  let testVetId: number;
  let testVaccineTypeId: number;

  const testDatabaseConfig = getTestDatabaseConfig();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot(testDatabaseConfig),
        PetModule,
        MedicalRecordModule,
        PetOwnerModule,
      ],
    }).compile();

    petService = module.get<PetService>(PetService);
    medicalRecordService =
      module.get<MedicalRecordService>(MedicalRecordService);

    petRepository = module.get<Repository<Pet>>(getRepositoryToken(Pet));
    medicalRecordRepository = module.get<Repository<MedicalRecord>>(
      getRepositoryToken(MedicalRecord),
    );
    vaccinationRepository = module.get<Repository<VaccinationHistory>>(
      getRepositoryToken(VaccinationHistory),
    );
    petOwnerRepository = module.get<Repository<PetOwner>>(
      getRepositoryToken(PetOwner),
    );
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
    vaccineTypeRepository = module.get<Repository<VaccineType>>(
      getRepositoryToken(VaccineType),
    );
    veterinarianRepository = module.get<Repository<Veterinarian>>(
      getRepositoryToken(Veterinarian),
    );
  }, 30000);

  afterAll(async () => {
    await module?.close();
  });

  beforeEach(async () => {
    // Clean up test data using raw SQL with CASCADE
    // Order matters due to foreign key constraints
    await accountRepository.query(
      'TRUNCATE TABLE "vaccination_history" CASCADE',
    );
    await accountRepository.query('TRUNCATE TABLE "medical_records" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "pets" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "vaccine_types" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "employees" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "pet_owners" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "accounts" CASCADE');
  });

  // Helper to create test owner directly in database
  async function createTestOwner(
    email = 'test.owner@example.com',
  ): Promise<PetOwner> {
    const account = await accountRepository.save({
      email,
      passwordHash: '$2b$10$hashedpassword',
      userType: UserType.PET_OWNER,
      isActive: true,
    });

    const owner = await petOwnerRepository.save({
      accountId: account.accountId,
      fullName: 'Test Owner',
      phoneNumber: '0123456789',
      address: '123 Test St',
    });

    return owner;
  }

  // Helper to create test vet
  async function createTestVet(): Promise<Veterinarian> {
    const account = await accountRepository.save({
      email: 'vet@test.com',
      passwordHash: '$2b$10$hashedpassword',
      userType: UserType.VETERINARIAN,
      isActive: true,
    });

    const vet = await veterinarianRepository.save({
      accountId: account.accountId,
      fullName: 'Dr. Test',
      phoneNumber: '0123456780',
      hireDate: new Date(),
      salary: 50000,
      licenseNumber: 'VET001',
      expertise: 'General',
    });

    return vet;
  }

  describe('Pet Management Integration', () => {
    beforeEach(async () => {
      const owner = await createTestOwner();
      testOwnerId = owner.petOwnerId;
    });

    it('should register pet and verify owner relationship', async () => {
      // PetService.registerPet returns PetResponseDto
      const createdPet = await petService.registerPet(
        {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          birthDate: new Date('2022-05-15'),
          gender: 'Male',
          weight: 25.5,
          color: 'Golden',
          initialHealthStatus: 'Healthy',
          specialNotes: 'Friendly and energetic',
        },
        testOwnerId,
      );

      // Verify pet was created (service returns DTO with 'id')
      expect(createdPet).toBeDefined();
      expect(createdPet.id).toBeDefined();
      expect(createdPet.name).toBe('Buddy');
      expect(createdPet.species).toBe('Dog');
      expect(createdPet.ownerId).toBe(testOwnerId);
      expect(createdPet.age).toBeDefined(); // Computed field from domain model

      // Verify in database
      const dbPet = await petRepository.findOne({
        where: { petId: createdPet.id },
        relations: ['owner'],
      });

      expect(dbPet).toBeDefined();
      expect(dbPet?.ownerId).toBe(testOwnerId);

      testPetId = createdPet.id;
    });

    it('should update pet information and maintain data integrity', async () => {
      // Create pet first
      const pet = await petService.registerPet(
        {
          name: 'Initial',
          species: 'Cat',
          breed: 'Siamese',
          birthDate: new Date('2021-03-10'),
          gender: 'Female',
          weight: 4.2,
          color: 'Cream',
          initialHealthStatus: 'Good',
        },
        testOwnerId,
      );

      // Update pet via service (returns DTO)
      const updatedPet = await petService.updatePetInfo(pet.id, {
        name: 'Updated Name',
        weight: 4.8,
        color: 'Cream with points',
        specialNotes: 'Updated notes',
      });

      // Verify updates
      expect(updatedPet.name).toBe('Updated Name');
      expect(updatedPet.weight).toBe(4.8);

      // Verify in database
      const dbPet = await petRepository.findOne({
        where: { petId: pet.id },
      });

      expect(dbPet?.name).toBe('Updated Name');
      // Use numeric comparison to avoid coupling to decimal string format
      expect(parseFloat(String(dbPet?.weight))).toBeCloseTo(4.8, 1);
      // Unchanged fields should remain
      expect(dbPet?.species).toBe('Cat');
      expect(dbPet?.breed).toBe('Siamese');
    });

    it('should soft delete and restore pet', async () => {
      // Create pet
      const pet = await petService.registerPet(
        {
          name: 'Delete Test',
          species: 'Dog',
          breed: 'Labrador',
          birthDate: new Date('2023-01-01'),
          gender: 'Male',
          weight: 30,
        },
        testOwnerId,
      );

      // Soft delete
      await petService.deletePet(pet.id);

      // Verify pet is marked as deleted (check with withDeleted)
      const deletedPet = await petRepository.findOne({
        where: { petId: pet.id },
        withDeleted: true,
      });
      expect(deletedPet?.deletedAt).toBeDefined();

      // Verify pet doesn't appear in normal queries
      const activePets = await petService.getPetsByOwner(testOwnerId);
      expect(activePets.some((p) => p.id === pet.id)).toBe(false);

      // Restore pet
      await petService.restore(pet.id);

      // Verify pet is restored
      const restoredPet = await petRepository.findOne({
        where: { petId: pet.id },
      });
      expect(restoredPet?.deletedAt).toBeNull();

      // Verify pet appears in normal queries again
      const restoredPets = await petService.getPetsByOwner(testOwnerId);
      expect(restoredPets.some((p) => p.id === pet.id)).toBe(true);
    });

    it('should transfer pet ownership between owners', async () => {
      // Create pet
      const pet = await petService.registerPet(
        {
          name: 'Transfer Test',
          species: 'Bird',
          breed: 'Parrot',
          birthDate: new Date('2020-06-01'),
          gender: 'Female',
          weight: 0.5,
        },
        testOwnerId,
      );

      // Create new owner
      const newOwner = await createTestOwner('new.owner@example.com');

      // Transfer ownership
      const transferredPet = await petService.transferPetOwnership(
        pet.id,
        newOwner.petOwnerId,
      );

      // Verify ownership change
      expect(transferredPet.ownerId).toBe(newOwner.petOwnerId);

      // Verify old owner no longer has this pet
      const oldOwnerPets = await petService.getPetsByOwner(testOwnerId);
      expect(oldOwnerPets.some((p) => p.id === pet.id)).toBe(false);

      // Verify new owner has the pet
      const newOwnerPets = await petService.getPetsByOwner(newOwner.petOwnerId);
      expect(newOwnerPets.some((p) => p.id === pet.id)).toBe(true);
    });
  });

  describe('Medical Record Integration', () => {
    beforeEach(async () => {
      // Create test owner, pet, and vet
      const owner = await createTestOwner('medical@example.com');
      testOwnerId = owner.petOwnerId;

      const pet = await petService.registerPet(
        {
          name: 'Medical Pet',
          species: 'Dog',
          breed: 'Beagle',
          birthDate: new Date('2021-08-15'),
          gender: 'Male',
          weight: 12,
        },
        testOwnerId,
      );
      testPetId = pet.id;

      const vet = await createTestVet();
      testVetId = vet.employeeId;
    });

    it('should create medical record and link to pet', async () => {
      // MedicalRecordService.createMedicalRecord uses DTO
      const createdRecord = await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'Routine checkup - healthy',
        treatment: 'Annual vaccination',
        medicalSummary: { temperature: 38.5, heartRate: 80 },
      });

      // Verify record was created (returns DTO with 'id')
      expect(createdRecord).toBeDefined();
      expect(createdRecord.id).toBeDefined();
      expect(createdRecord.diagnosis).toBe('Routine checkup - healthy');
      expect(createdRecord.petId).toBe(testPetId);

      // Verify in database
      const dbRecord = await medicalRecordRepository.findOne({
        where: { recordId: createdRecord.id },
        relations: ['pet'],
      });

      expect(dbRecord).toBeDefined();
      expect(dbRecord?.pet.petId).toBe(testPetId);

      testMedicalRecordId = createdRecord.id;
    });

    it('should retrieve complete medical history for pet', async () => {
      // Create multiple medical records
      await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'First visit',
        treatment: 'Vaccination',
      });

      await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'Follow-up',
        treatment: 'Checkup',
      });

      // Get medical history
      const history =
        await medicalRecordService.getMedicalHistoryByPet(testPetId);

      expect(history.length).toBe(2);
      // Verify both records belong to the pet
      expect(history.every((record) => record.petId === testPetId)).toBe(true);
    });

    it('should update medical record information', async () => {
      // Create record first
      const record = await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'Initial diagnosis',
        treatment: 'Initial treatment',
      });

      // Update record
      const updatedRecord = await medicalRecordService.updateMedicalRecord(
        record.id,
        {
          diagnosis: 'Updated diagnosis',
          treatment: 'Updated treatment',
        },
      );

      // Verify updates
      expect(updatedRecord.diagnosis).toBe('Updated diagnosis');
      expect(updatedRecord.treatment).toBe('Updated treatment');
    });

    it('should identify overdue follow-ups', async () => {
      // Create record with past follow-up date
      await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'Checkup needed',
        treatment: 'Monitoring',
        followUpDate: new Date('2024-01-10'), // Past date
      });

      // Create record with future follow-up date
      await medicalRecordService.createMedicalRecord({
        petId: testPetId,
        veterinarianId: testVetId,
        diagnosis: 'Future checkup',
        treatment: 'Monitoring',
        followUpDate: new Date('2026-01-01'), // Future date
      });

      // Get overdue follow-ups
      const overdue = await medicalRecordService.getOverdueFollowUps(testPetId);

      expect(overdue.length).toBe(1);
      expect(new Date(overdue[0].followUpDate).getTime()).toBeLessThan(
        new Date().getTime(),
      );
    });
  });

  describe('Vaccination Integration', () => {
    beforeEach(async () => {
      // Create test owner, pet, vet, and vaccine type
      const owner = await createTestOwner('vaccine@example.com');
      testOwnerId = owner.petOwnerId;

      const pet = await petService.registerPet(
        {
          name: 'Vaccine Pet',
          species: 'Cat',
          breed: 'Persian',
          birthDate: new Date('2022-12-01'),
          gender: 'Female',
          weight: 3.5,
        },
        testOwnerId,
      );
      testPetId = pet.id;

      const vet = await createTestVet();
      testVetId = vet.employeeId;

      const vaccineType = await vaccineTypeRepository.save({
        vaccineName: 'Rabies',
        category: VaccineCategory.CORE,
        targetSpecies: 'Cat',
        description: 'Rabies vaccination',
        boosterIntervalMonths: 12,
      });
      testVaccineTypeId = vaccineType.vaccineTypeId;
    });

    it('should add vaccination record to pet', async () => {
      const createdVaccination = await medicalRecordService.addVaccination(
        testPetId,
        {
          vaccineTypeId: testVaccineTypeId,
          administeredBy: testVetId,
          administrationDate: new Date('2024-03-01'),
          batchNumber: 'BATCH001',
          site: 'Left shoulder',
          notes: 'Routine vaccination',
        },
      );

      // Verify vaccination was created (returns DTO with 'id')
      expect(createdVaccination).toBeDefined();
      expect(createdVaccination.id).toBeDefined();
      expect(createdVaccination.petId).toBe(testPetId);
      expect(createdVaccination.isDue).toBeDefined(); // Computed field
      expect(createdVaccination.daysUntilDue).toBeDefined(); // Computed field

      // Verify in database
      const dbVaccination = await vaccinationRepository.findOne({
        where: { vaccinationId: createdVaccination.id },
        relations: ['pet', 'vaccineType'],
      });

      expect(dbVaccination).toBeDefined();
      expect(dbVaccination?.pet.petId).toBe(testPetId);
      expect(dbVaccination?.vaccineType.vaccineTypeId).toBe(testVaccineTypeId);
    });

    it('should retrieve vaccination history for pet', async () => {
      // Add multiple vaccinations
      await medicalRecordService.addVaccination(testPetId, {
        vaccineTypeId: testVaccineTypeId,
        administeredBy: testVetId,
        administrationDate: new Date('2023-03-01'),
        batchNumber: 'BATCH001',
      });

      await medicalRecordService.addVaccination(testPetId, {
        vaccineTypeId: testVaccineTypeId,
        administeredBy: testVetId,
        administrationDate: new Date('2024-03-01'),
        batchNumber: 'BATCH002',
      });

      // Get vaccination history
      const history =
        await medicalRecordService.getVaccinationHistory(testPetId);

      expect(history.length).toBe(2);
      expect(history.every((vac) => vac.petId === testPetId)).toBe(true);
    });

    it('should identify upcoming vaccinations', async () => {
      // Add vaccination with upcoming due date (auto-calculated)
      await medicalRecordService.addVaccination(testPetId, {
        vaccineTypeId: testVaccineTypeId,
        administeredBy: testVetId,
        administrationDate: new Date(), // Today - so due in 12 months (future)
        batchNumber: 'BATCH003',
      });

      // Get upcoming vaccinations
      const upcoming = await medicalRecordService.getUpcomingVaccinations(
        testPetId,
        365,
      );

      expect(upcoming.length).toBe(1);
    });

    it('should identify overdue vaccinations', async () => {
      // Add vaccination with past due date
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 14); // 14 months ago

      await medicalRecordService.addVaccination(testPetId, {
        vaccineTypeId: testVaccineTypeId,
        administeredBy: testVetId,
        administrationDate: pastDate,
        batchNumber: 'BATCH004',
      });

      // Get overdue vaccinations
      const overdue =
        await medicalRecordService.getOverdueVaccinations(testPetId);

      expect(overdue.length).toBe(1);
      expect(overdue[0].isDue).toBe(true);
    });
  });

  describe('Cross-Domain Integration', () => {
    it('should maintain data consistency across pet and medical domains', async () => {
      // Create owner and pet
      const owner = await createTestOwner('consistency@example.com');
      const vet = await createTestVet();

      const pet = await petService.registerPet(
        {
          name: 'Consistency Pet',
          species: 'Dog',
          breed: 'Mixed',
          birthDate: new Date('2023-01-01'),
          gender: 'Male',
          weight: 20,
        },
        owner.petOwnerId,
      );

      // Create vaccine type
      const vaccineType = await vaccineTypeRepository.save({
        vaccineName: 'Distemper',
        category: VaccineCategory.CORE,
        targetSpecies: 'Dog',
        boosterIntervalMonths: 12,
      });

      // Create medical record
      const medicalRecord = await medicalRecordService.createMedicalRecord({
        petId: pet.id,
        veterinarianId: vet.employeeId,
        diagnosis: 'Annual checkup',
        treatment: 'Vaccinations',
      });

      // Add vaccination
      const vaccination = await medicalRecordService.addVaccination(pet.id, {
        vaccineTypeId: vaccineType.vaccineTypeId,
        administeredBy: vet.employeeId,
        administrationDate: new Date(),
        batchNumber: 'BATCH007',
      });

      // Verify all relationships are maintained
      const dbPet = await petRepository.findOne({
        where: { petId: pet.id },
        relations: ['owner', 'medicalRecords', 'vaccinationHistory'],
      });

      expect(dbPet?.ownerId).toBe(owner.petOwnerId);
      expect(dbPet?.medicalRecords.length).toBe(1);
      expect(dbPet?.vaccinationHistory.length).toBe(1);
    });

    it('should handle pet deletion cascade effects on medical data', async () => {
      // Create pet with medical data
      const owner = await createTestOwner('cascade@example.com');
      const vet = await createTestVet();

      const pet = await petService.registerPet(
        {
          name: 'Cascade Pet',
          species: 'Bird',
          breed: 'Canary',
          birthDate: new Date('2022-01-01'),
          gender: 'Male',
          weight: 0.1,
        },
        owner.petOwnerId,
      );

      const medicalRecord = await medicalRecordService.createMedicalRecord({
        petId: pet.id,
        veterinarianId: vet.employeeId,
        diagnosis: 'Wing injury',
        treatment: 'Rest and care',
      });

      // Soft delete pet
      await petService.deletePet(pet.id);

      // Verify medical record is still accessible (soft delete shouldn't cascade)
      const dbRecord = await medicalRecordRepository.findOne({
        where: { recordId: medicalRecord.id },
        relations: ['pet'],
        withDeleted: true,
      });

      expect(dbRecord).toBeDefined();
      expect(dbRecord?.pet.petId).toBe(pet.id);
      // Pet should still exist but be marked as deleted
      expect(dbRecord?.pet.deletedAt).toBeDefined();
    });
  });
});
