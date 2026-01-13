import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * PetController Integration Tests
 * Tests real HTTP endpoints with actual database operations
 * 
 * All fields verified from implementation code
 */
describe('PetController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  // Test data
  let petOwnerAccount: Account;
  let petOwner: PetOwner;
  let petOwner2Account: Account;
  let petOwner2: PetOwner;
  let vetAccount: Account;
  let vet: Veterinarian;
  let receptionistAccount: Account;
  let receptionist: Receptionist;
  let managerAccount: Account;
  let manager: Manager;
  let pet1: Pet;
  let pet2: Pet;
  let petOwnerToken: string;
  let petOwner2Token: string;
  let vetToken: string;
  let receptionistToken: string;
  let managerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Pet owner 1
    petOwnerAccount = await dataSource.getRepository(Account).save({
      email: 'owner@test.com',
      passwordHash: hashedPassword,
      userType: 'PET_OWNER',
      isActive: true,
    });
    
    petOwner = await dataSource.getRepository(PetOwner).save({
      accountId: petOwnerAccount.accountId,
      fullName: 'John Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      preferredContactMethod: 'Email',
      emergencyContact: '+0987654321',
    });
    
    // Pet owner 2
    petOwner2Account = await dataSource.getRepository(Account).save({
      email: 'owner2@test.com',
      passwordHash: hashedPassword,
      userType: 'PET_OWNER',
      isActive: true,
    });
    
    petOwner2 = await dataSource.getRepository(PetOwner).save({
      accountId: petOwner2Account.accountId,
      fullName: 'Jane Smith',
      phoneNumber: '+1122334455',
      address: '456 Oak Ave',
      preferredContactMethod: 'Phone',
      emergencyContact: '+5544332211',
    });
    
    // Veterinarian
    vetAccount = await dataSource.getRepository(Account).save({
      email: 'vet@test.com',
      passwordHash: hashedPassword,
      userType: 'VETERINARIAN',
      isActive: true,
    });
    
    vet = await dataSource.getRepository(Veterinarian).save({
      accountId: vetAccount.accountId,
      fullName: 'Dr. Smith',
      phoneNumber: '+0987654321',
      address: '456 Vet St',
      hireDate: new Date('2020-01-01'),
      salary: 5000.00,
      isAvailable: true,
      licenseNumber: 'VET123456',
      expertise: 'General Practice',
    });
    
    // Receptionist
    receptionistAccount = await dataSource.getRepository(Account).save({
      email: 'receptionist@test.com',
      passwordHash: hashedPassword,
      userType: 'RECEPTIONIST',
      isActive: true,
    });
    
    receptionist = await dataSource.getRepository(Receptionist).save({
      accountId: receptionistAccount.accountId,
      fullName: 'Jane Admin',
      phoneNumber: '+1122334455',
      address: '789 Office St',
      hireDate: new Date('2021-01-01'),
      salary: 3000.00,
      isAvailable: true,
      shift: 'Morning',
    });
    
    // Manager
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      userType: 'MANAGER',
      isActive: true,
    });
    
    manager = await dataSource.getRepository(Manager).save({
      accountId: managerAccount.accountId,
      fullName: 'Bob Manager',
      phoneNumber: '+9988776655',
      address: '321 Boss St',
      hireDate: new Date('2019-01-01'),
      salary: 8000.00,
      isAvailable: true,
      department: 'Operations',
      officeLocation: 'Building A',
    });
    
    // Create pets
    pet1 = await dataSource.getRepository(Pet).save({
      ownerId: petOwner.petOwnerId,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthDate: new Date('2020-01-15'),
      gender: 'Male',
      weight: 25.5,
      initialHealthStatus: 'Healthy',
    });
    
    pet2 = await dataSource.getRepository(Pet).save({
      ownerId: petOwner2.petOwnerId,
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Persian',
      birthDate: new Date('2021-06-20'),
      gender: 'Female',
      weight: 4.2,
      initialHealthStatus: 'Healthy',
    });
    
    // Generate tokens
    petOwnerToken = jwtService.sign({
      id: petOwnerAccount.accountId,
      email: petOwnerAccount.email,
    });
    
    petOwner2Token = jwtService.sign({
      id: petOwner2Account.accountId,
      email: petOwner2Account.email,
    });
    
    vetToken = jwtService.sign({
      id: vetAccount.accountId,
      email: vetAccount.email,
    });
    
    receptionistToken = jwtService.sign({
      id: receptionistAccount.accountId,
      email: receptionistAccount.email,
    });
    
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
    });
  });

  describe('POST /api/pets/me', () => {
    it('[P-01] should register pet by owner', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/pets/me')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          birthDate: '2022-03-10',
          gender: 'Male',
          weight: 30.0,
        })
        .expect(201);

      expect(response.body.name).toBe('Max');
      expect(response.body.species).toBe('Dog');
      expect(response.body.id).toBeDefined();
    });

    it('[P-02] should return 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/pets/me')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          species: 'Dog',
        })
        .expect(400);
    });

    it('[P-03] should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .post('/api/pets/me')
        .send({
          name: 'Max',
          species: 'Dog',
        })
        .expect(401);
    });
  });

  describe('GET /api/pets/me', () => {
    it('[P-04] should return only owner pets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pets/me')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Buddy');
    });

    it('[P-05] should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .get('/api/pets/me')
        .expect(401);
    });
  });

  describe('GET /api/pets/:id', () => {
    it('[P-06] should return pet by ID for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/pets/${pet1.petId}`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body.id).toBe(pet1.petId);
      expect(response.body.name).toBe('Buddy');
    });

    it('[P-07] should return pet by ID for veterinarian', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/pets/${pet1.petId}`)
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(200);

      expect(response.body.id).toBe(pet1.petId);
    });

    it('[P-08] should return 404 for non-existent pet', async () => {
      await request(app.getHttpServer())
        .get('/api/pets/99999')
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(404);
    });

    it('[P-09] should return 401 when no token', async () => {
      await request(app.getHttpServer())
        .get(`/api/pets/${pet1.petId}`)
        .expect(401);
    });
  });

  describe('PUT /api/pets/:id', () => {
    it('[P-10] should update pet by owner', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/pets/${pet1.petId}`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          weight: 26.5,
        })
        .expect(200);

      expect(response.body.weight).toBe(26.5);
      
      // Verify DB update
      const updated = await dataSource.getRepository(Pet).findOne({
        where: { petId: pet1.petId },
      });
      expect(parseFloat(updated.weight as any)).toBe(26.5);
    });

    it('[P-11] should return 404 for non-existent pet', async () => {
      await request(app.getHttpServer())
        .put('/api/pets/99999')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          weight: 30.0,
        })
        .expect(404);
    });
  });

  describe('GET /api/pets', () => {
    it('[P-12] should return all pets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pets')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('[P-13] should filter pets by species', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pets?species=Dog')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].species).toBe('Dog');
    });

    it('[P-14] should filter pets by ownerId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/pets?ownerId=${petOwner.petOwnerId}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Buddy');
    });
  });
});
