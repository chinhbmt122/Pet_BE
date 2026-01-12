/**
 * Critical Flow E2E Tests: Medical Record Flow
 *
 * Tests the complete medical consultation journey:
 * 1. Pet owner has appointment scheduled
 * 2. Veterinarian completes appointment
 * 3. Veterinarian creates medical record with diagnosis & treatment
 * 4. Veterinarian adds vaccination record
 * 5. Pet owner views their pet's medical history
 * 6. Pet owner checks vaccination schedule
 *
 * Run with: npm run test:e2e -- tests/e2e/flows/medical-record-flow.e2e-spec.ts
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../../integration/test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { VaccineType, VaccineCategory } from '../../../src/entities/vaccine-type.entity';


describe('Critical Flow: Medical Record Journey', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let jwtService: JwtService;

    // Tokens
    let vetToken: string;
    let ownerToken: string;
    let receptionistToken: string;

    // Test data
    let veterinarian: Veterinarian;
    let petOwner: PetOwner;
    let pet: Pet;
    let service: Service;
    let appointment: Appointment;
    let vaccineType: VaccineType;

    beforeAll(async () => {
        jest.setTimeout(120000);
        app = await createTestApp();
        dataSource = app.get(DataSource);
        jwtService = app.get(JwtService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await cleanDatabase(app);
        await setupTestData();
    });

    async function setupTestData() {
        const passwordHash = await bcrypt.hash('password123', 10);

        // 1. Create Veterinarian
        const vetAccount = await dataSource.getRepository(Account).save({
            email: 'vet_flow@test.com',
            passwordHash,
            userType: UserType.VETERINARIAN,
            isActive: true,
        });

        vetToken = jwtService.sign({
            id: vetAccount.accountId,
            email: vetAccount.email,
        });

        veterinarian = await dataSource.getRepository(Veterinarian).save({
            accountId: vetAccount.accountId,
            fullName: 'Dr. Smith',
            phoneNumber: '1112223333',
            hireDate: new Date(),
            salary: 6000,
            licenseNumber: 'VET-FLOW-001',
            expertise: 'General Practice',
            isAvailable: true,
        });

        // 2. Create Pet Owner
        const ownerAccount = await dataSource.getRepository(Account).save({
            email: 'owner_flow@test.com',
            passwordHash,
            userType: UserType.PET_OWNER,
            isActive: true,
        });

        ownerToken = jwtService.sign({
            id: ownerAccount.accountId,
            email: ownerAccount.email,
        });

        petOwner = await dataSource.getRepository(PetOwner).save({
            accountId: ownerAccount.accountId,
            fullName: 'John Doe',
            phoneNumber: '9998887777',
            address: '123 Pet Street',
        });

        // 3. Create Pet
        pet = await dataSource.getRepository(Pet).save({
            ownerId: petOwner.petOwnerId,
            name: 'Max',
            species: 'Dog',
            breed: 'Golden Retriever',
            age: 3,
            gender: 'Male',
            weight: 30.5,
        });

        // 4. Create Service
        const category = await dataSource.getRepository(ServiceCategory).save({
            categoryName: 'Medical Checkup',
            description: 'General health checkups',
        });

        service = await dataSource.getRepository(Service).save({
            categoryId: category.categoryId,
            serviceName: 'General Checkup',
            description: 'Complete health examination',
            basePrice: 150.0,
            estimatedDuration: 30,
            requiredStaffType: 'Veterinarian',
            isAvailable: true,
        });

        // 5. Create Completed Appointment (simulating post-checkup state)
        appointment = await dataSource.getRepository(Appointment).save({
            petId: pet.petId,
            serviceId: service.serviceId,
            employeeId: veterinarian.employeeId,
            appointmentDate: new Date(),
            startTime: '10:00',
            endTime: '10:30',
            status: AppointmentStatus.COMPLETED,
            actualCost: 150.0,
            notes: 'Routine checkup',
        });

        // 6. Create Vaccine Type for vaccination tests
        vaccineType = await dataSource.getRepository(VaccineType).save({
            category: VaccineCategory.CORE,
            vaccineName: 'Rabies Vaccine',
            targetSpecies: 'Dog',
            manufacturer: 'VetPharm',
            description: 'Annual rabies vaccination',
            recommendedAgeMonths: 3,
            boosterIntervalMonths: 12,
        });

        // 7. Create Receptionist (for appointment status changes)
        const receptionistAccount = await dataSource.getRepository(Account).save({
            email: 'receptionist_flow@test.com',
            passwordHash,
            userType: UserType.RECEPTIONIST,
            isActive: true,
        });

        receptionistToken = jwtService.sign({
            id: receptionistAccount.accountId,
            email: receptionistAccount.email,
        });

        await dataSource.getRepository(Receptionist).save({
            accountId: receptionistAccount.accountId,
            fullName: 'Jane Receptionist',
            phoneNumber: '5554443333',
            hireDate: new Date(),
            salary: 3500,
            isAvailable: true,
        });
    }

    describe('Flow: Veterinarian Creates Medical Record After Checkup', () => {
        it('Step 1: Vet creates medical record with diagnosis and treatment', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/medical-records')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    petId: pet.petId,
                    veterinarianId: veterinarian.employeeId,
                    diagnosis: 'Mild ear infection',
                    treatment: 'Antibiotic ear drops, apply twice daily for 7 days',
                    medicalSummary: {
                        weight: 30.5,
                        temperature: 38.6,
                        heartRate: 80,
                        symptoms: ['Head shaking', 'Scratching ear'],
                        notes: 'Follow-up in 2 weeks if symptoms persist',
                    },
                    followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.diagnosis).toBe('Mild ear infection');
            expect(response.body.petId).toBe(pet.petId);
            expect(response.body.veterinarianId).toBe(veterinarian.employeeId);
        });

        it('Step 2: Vet adds vaccination record for the pet', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/pets/${pet.petId}/vaccinations`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    vaccineTypeId: vaccineType.vaccineTypeId,
                    administeredBy: veterinarian.employeeId,
                    administrationDate: new Date().toISOString().split('T')[0],
                    batchNumber: 'BATCH-2026-001',
                    notes: 'Annual rabies vaccination',
                })
                .expect(201);

            expect(response.body.petId || response.body.data?.petId).toBe(pet.petId);
            expect(response.body.vaccineTypeId || response.body.data?.vaccineTypeId).toBe(vaccineType.vaccineTypeId);
            expect(response.body.vaccinationId || response.body.data?.vaccinationId || response.body.id).toBeDefined();
        });
    });

    describe('Flow: Pet Owner Views Medical History', () => {
        let medicalRecordId: number;

        beforeEach(async () => {
            // Create a medical record first
            const recordRes = await request(app.getHttpServer())
                .post('/api/medical-records')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    petId: pet.petId,
                    veterinarianId: veterinarian.employeeId,
                    diagnosis: 'Annual checkup - healthy',
                    treatment: 'No treatment needed',
                });
            medicalRecordId = recordRes.body.id;

            // Add vaccination
            await request(app.getHttpServer())
                .post(`/api/pets/${pet.petId}/vaccinations`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    vaccineTypeId: vaccineType.vaccineTypeId,
                    administeredBy: veterinarian.employeeId,
                    administrationDate: new Date().toISOString().split('T')[0],
                    batchNumber: 'BATCH-2026-002',
                });
        });

        it('Step 3: Pet owner views their pet\'s medical history', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/medical-records/pet/${pet.petId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].diagnosis).toBe('Annual checkup - healthy');
        });

        it('Step 4: Pet owner views their pet\'s vaccination history', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/pets/${pet.petId}/vaccinations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].vaccineTypeId).toBe(vaccineType.vaccineTypeId);
        });

        it('Step 5: Pet owner checks upcoming vaccinations', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/pets/${pet.petId}/vaccinations/upcoming?days=365`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should have upcoming rabies booster
        });
    });

    describe('Flow: Complete Medical Consultation Journey', () => {
        it('should complete full journey: checkup → diagnosis → vaccination → history', async () => {
            // === Step 1: Vet creates detailed medical record ===
            const recordRes = await request(app.getHttpServer())
                .post('/api/medical-records')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    petId: pet.petId,
                    veterinarianId: veterinarian.employeeId,
                    diagnosis: 'Routine checkup - excellent health',
                    treatment: 'Continue current diet and exercise',
                    medicalSummary: {
                        weight: 30.5,
                        temperature: 38.5,
                        heartRate: 78,
                        overallCondition: 'Excellent',
                        notes: 'Pet is in great condition. Recommended annual vaccination.',
                    },
                })
                .expect(201);

            const recordId = recordRes.body.id;
            expect(recordId).toBeDefined();

            // === Step 2: Vet administers vaccination ===
            const vaccineRes = await request(app.getHttpServer())
                .post(`/api/pets/${pet.petId}/vaccinations`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    vaccineTypeId: vaccineType.vaccineTypeId,
                    administeredBy: veterinarian.employeeId,
                    administrationDate: new Date().toISOString().split('T')[0],
                    batchNumber: 'BATCH-FULL-001',
                    notes: 'Administered during annual checkup',
                })
                .expect(201);

            expect(vaccineRes.body.vaccinationId || vaccineRes.body.data?.vaccinationId || vaccineRes.body.id).toBeDefined();

            // === Step 3: Pet owner views medical record ===
            const historyRes = await request(app.getHttpServer())
                .get(`/api/medical-records/pet/${pet.petId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(historyRes.body.length).toBeGreaterThan(0);
            const lastRecord = historyRes.body[0];
            expect(lastRecord.diagnosis).toBe('Routine checkup - excellent health');

            // === Step 4: Pet owner views vaccination record ===
            const vaccHistoryRes = await request(app.getHttpServer())
                .get(`/api/pets/${pet.petId}/vaccinations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(vaccHistoryRes.body.length).toBeGreaterThan(0);
            expect(vaccHistoryRes.body[0].batchNumber).toBe('BATCH-FULL-001');

            // === Step 5: Verify the vet can see their records ===
            const vetRecordsRes = await request(app.getHttpServer())
                .get('/api/medical-records/me')
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            expect(vetRecordsRes.body.length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should require veterinarian for creating medical records', async () => {
            // Pet owner tries to create a medical record
            const response = await request(app.getHttpServer())
                .post('/api/medical-records')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    petId: pet.petId,
                    veterinarianId: veterinarian.employeeId,
                    diagnosis: 'Self-diagnosis',
                    treatment: 'Self-treatment',
                });
            // Should be forbidden for non-vets
            expect([400, 403]).toContain(response.status);
        });

        it('should return empty array for pet with no medical records', async () => {
            // Create a new pet with no records
            const newPet = await dataSource.getRepository(Pet).save({
                ownerId: petOwner.petOwnerId,
                name: 'NewPet',
                species: 'Cat',
                breed: 'Siamese',
                age: 1,
                gender: 'Female',
            });

            const response = await request(app.getHttpServer())
                .get(`/api/medical-records/pet/${newPet.petId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            // Should return empty array for pet with no records
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });
});
