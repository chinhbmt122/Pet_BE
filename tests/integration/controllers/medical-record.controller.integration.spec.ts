import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { MedicalRecord } from '../../../src/entities/medical-record.entity';

describe('MedicalRecordController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  let vetToken: string;
  let managerToken: string;
  let ownerToken: string;
  let vetAccount: Account;
  let managerAccount: Account;
  let ownerAccount: Account;
  
  let veterinarian: Veterinarian;
  let petOwner: PetOwner;
  let pet: Pet;

  beforeAll(async () => {
    jest.setTimeout(60000);
    app = await createTestApp();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    const passwordHash = await bcrypt.hash('password123', 10);
    const accountRepo = dataSource.getRepository(Account);

    // 1. Create Vet
    vetAccount = await accountRepo.save({
      email: 'vet_med@test.com',
      passwordHash,
      userType: UserType.VETERINARIAN,
      isActive: true,
    });
    vetToken = jwtService.sign({
      id: vetAccount.accountId,
      email: vetAccount.email,
      role: vetAccount.userType,
    });
    
    veterinarian = await dataSource.getRepository(Veterinarian).save({
      accountId: vetAccount.accountId,
      fullName: 'Dr. Medical',
      phoneNumber: '1112223333',
      hireDate: new Date(),
      salary: 6000,
      licenseNumber: 'VET-MED-001',
      expertise: 'General',
    });

    // 2. Create Manager (for getAll)
    managerAccount = await accountRepo.save({
      email: 'manager_med@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });

    // 3. Create Pet Owner
    ownerAccount = await accountRepo.save({
      email: 'owner_med@test.com',
      passwordHash,
      userType: UserType.PET_OWNER,
      isActive: true,
    });
    ownerToken = jwtService.sign({
      id: ownerAccount.accountId,
      email: ownerAccount.email,
      role: ownerAccount.userType,
    });

    petOwner = await dataSource.getRepository(PetOwner).save({
      accountId: ownerAccount.accountId,
      fullName: 'Pet Owner A',
      phoneNumber: '9998887777',
      address: '123 Pet St',
    });

    // 4. Create Pet
    pet = await dataSource.getRepository(Pet).save({
      ownerId: petOwner.petOwnerId,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      gender: 'Male',
    });
  });

  describe('POST /api/medical-records', () => {
    it('[MR-01] should create medical record (Veterinarian)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          petId: pet.petId,
          veterinarianId: veterinarian.employeeId,
          diagnosis: 'Fever',
          treatment: 'Rest and water',
          medicalSummary: { temp: 39.5 }
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.diagnosis).toBe('Fever');
      expect(response.body.petId).toBe(pet.petId);
    });

    it('[MR-02] should return 400 if validation fails', async () => {
      await request(app.getHttpServer())
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          // Missing required fields
          petId: pet.petId,
        })
        .expect(400);
    });
  });

  describe('GET /api/medical-records/me', () => {
    beforeEach(async () => {
      // Create a record first
       await request(app.getHttpServer())
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          petId: pet.petId,
          veterinarianId: veterinarian.employeeId,
          diagnosis: 'My Record',
          treatment: 'Details',
        });
    });

    it('[MR-03] should get records created by current vet', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/medical-records/me')
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].diagnosis).toBe('My Record');
    });
  });

  describe('GET /api/medical-records', () => {
    beforeEach(async () => {
       await request(app.getHttpServer())
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          petId: pet.petId,
          veterinarianId: veterinarian.employeeId,
          diagnosis: 'General Record',
          treatment: 'Details',
        });
    });

    it('[MR-04] should get all records (Manager)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/medical-records/:id', () => {
    let recordId: number;
    
    beforeEach(async () => {
       const res = await request(app.getHttpServer())
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          petId: pet.petId,
          veterinarianId: veterinarian.employeeId,
          diagnosis: 'Specific Record',
          treatment: 'Details',
        });
       recordId = res.body.id;
    });

    it('[MR-05] should get record by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/medical-records/${recordId}`)
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(recordId);
      expect(response.body.diagnosis).toBe('Specific Record');
    });
    
    it('[MR-06] should return 404 for non-existent record', async () => {
      await request(app.getHttpServer())
        .get('/api/medical-records/999999')
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(404);
    });
  });
});
